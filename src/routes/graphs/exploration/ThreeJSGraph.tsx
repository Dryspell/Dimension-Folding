// ThreeJSGraph.tsx
import { onMount, createSignal, Setter, createEffect, onCleanup } from "solid-js";
import Timeline from "./Timeline";
import * as THREE from "three";
import Graph from "graphology";
import {
  addAxesHelper,
  addGridHelpers,
  createSpheresAndIntersections,
  drawEdges,
  initSceneAndControls,
  populateGraphScene,
  updateEdges,
  updateSpheresAndIntersections,
} from "./threeUtils";
import { updateCoordinates } from "./matrixUtils";
import { Button } from "~/components/ui/button";
import { Switch, SwitchControl, SwitchLabel } from "~/components/ui/switch";
import { Slider } from "~/components/ui/slider";
import { Card } from "~/components/ui/card";

interface ThreeJSGraphProps {
  graph: Graph;
  width: number;
  height: number;
  setCoordinates: Setter<{
    [key: string]: [number, number, number];
  }>;
}

/**
 * Computes the position of a node at a given transformation index and interpolation factor.
 * This is a pure function that doesn't mutate any state.
 */
function computeNodePosition(
  originalPosition: THREE.Vector3,
  transformations: THREE.Matrix4[],
  transformIndex: number,
  interpolationFactor: number
): THREE.Vector3 {
  const position = originalPosition.clone();

  // Apply all completed transformations
  for (let i = 0; i < transformIndex; i++) {
    position.applyMatrix4(transformations[i]);
  }

  // Apply partial current transformation if we're mid-step
  if (transformIndex < transformations.length && interpolationFactor > 0) {
    const preTransform = position.clone();
    const postTransform = position.clone().applyMatrix4(transformations[transformIndex]);
    position.lerpVectors(preTransform, postTransform, interpolationFactor);
  }

  return position;
}

export default function ThreeJSGraph(props: ThreeJSGraphProps) {
  let containerRef: HTMLDivElement | undefined;

  // Scene objects (set once during mount)
  const [camera, setCamera] = createSignal<THREE.PerspectiveCamera | null>(null);
  const [renderer, setRenderer] = createSignal<THREE.WebGLRenderer | null>(null);

  // UI state
  const [hoveredNodeInfo, setHoveredNodeInfo] = createSignal<{
    label: string;
    coordinates: number[];
  } | null>(null);
  const [showGrid, setShowGrid] = createSignal(false);

  // Playback state
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [playbackSpeed, setPlaybackSpeed] = createSignal(1); // Always positive
  const [playbackDirection, setPlaybackDirection] = createSignal<1 | -1>(1); // 1 = forward, -1 = reverse
  const [currentTransformationIndex, setCurrentTransformationIndex] = createSignal(0);
  const [interpolationFactor, setInterpolationFactor] = createSignal(0);

  // Visualization toggles
  const [showSpheres, setShowSpheres] = createSignal(true);
  const [showIntersections, setShowIntersections] = createSignal(true);

  // Scene object arrays (mutated during runtime)
  const spheres: THREE.Mesh[] = [];
  const circles: THREE.Mesh[] = [];
  const intersectionPoints: THREE.Mesh[] = [];

  // Define the transformations sequence
  // TODO: These should be configurable or derived from linkage constraints
  const transformations = [
    new THREE.Matrix4().makeRotationY(Math.PI / 4),
    new THREE.Matrix4().makeScale(1.5, 1.5, 1.5),
    new THREE.Matrix4().makeRotationZ(Math.PI / 4),
    new THREE.Matrix4().makeTranslation(1, 0, 0),
  ];

  // Store ORIGINAL positions (never mutated after initialization)
  const originalPositions: THREE.Vector3[] = [];
  const nodeMeshes: THREE.Mesh[] = [];
  const nodeMeshMap: { [nodeId: string]: THREE.Mesh } = {};
  const edges: THREE.LineSegments[] = [];

  let animationFrameId: number | null = null;
  const mouse = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();

  const scene = new THREE.Scene();
  scene.rotation.x = -Math.PI / 2; // Rotate so Z-axis is up

  // Effect to update sphere visibility
  createEffect(() => {
    if (!containerRef || !spheres.length) return;
    spheres.forEach((sphere) => (sphere.visible = showSpheres()));
  });

  // Effect to update intersection visibility
  createEffect(() => {
    if (!containerRef || !(circles.length || intersectionPoints.length)) return;
    circles.forEach((circle) => (circle.visible = showIntersections()));
    intersectionPoints.forEach((point) => (point.visible = showIntersections()));
  });

  /**
   * Updates all node positions based on current transformation state.
   * This is the single source of truth for node positions.
   */
  function updateNodePositions() {
    const transformIndex = currentTransformationIndex();
    const factor = interpolationFactor();

    nodeMeshes.forEach((mesh, i) => {
      const newPosition = computeNodePosition(
        originalPositions[i],
        transformations,
        transformIndex,
        factor
      );
      mesh.position.copy(newPosition);
      // Update userData for hover display
      mesh.userData.coordinates = [newPosition.x, newPosition.y, newPosition.z];
    });

    // Update dependent visualizations
    props.setCoordinates(updateCoordinates(props.graph, nodeMeshMap));
    updateEdges(props.graph, nodeMeshMap, edges);
    updateSpheresAndIntersections(
      scene,
      props.graph,
      nodeMeshMap,
      spheres,
      circles,
      intersectionPoints
    );
  }

  onMount(() => {
    if (!containerRef) return;

    const {
      renderer: rendererInstance,
      controls,
      camera: cameraInstance,
    } = initSceneAndControls(props.width, props.height, containerRef);
    setRenderer(rendererInstance);
    setCamera(cameraInstance);

    addAxesHelper(scene);
    addGridHelpers(showGrid, scene);

    // Populate scene and capture original positions
    populateGraphScene(
      props.graph,
      originalPositions,
      nodeMeshes,
      nodeMeshMap,
      scene
    );

    // Draw edges (only once, not in populateGraphScene)
    drawEdges(props.graph, nodeMeshMap, scene, edges);

    // Create constraint visualization
    createSpheresAndIntersections(
      props.graph,
      nodeMeshMap,
      scene,
      spheres,
      circles,
      intersectionPoints
    );

    // Initial coordinate sync
    props.setCoordinates(updateCoordinates(props.graph, nodeMeshMap));

    // Mouse tracking for hover
    const onMouseMove = (event: MouseEvent) => {
      const rect = rendererInstance.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };
    window.addEventListener("mousemove", onMouseMove);

    // Main animation loop
    const animate = () => {
      controls.update();

      if (isPlaying()) {
        const direction = playbackDirection();
        const speed = playbackSpeed();
        const stepSize = direction * speed * 0.02;

        let newFactor = interpolationFactor() + stepSize;
        let newIndex = currentTransformationIndex();

        // Handle factor overflow/underflow
        if (newFactor >= 1) {
          // Completed current transformation, move to next
          newIndex++;
          if (newIndex >= transformations.length) {
            // Reached end of all transformations
            newIndex = transformations.length - 1;
            newFactor = 1;
            setIsPlaying(false);
          } else {
            newFactor = 0;
          }
        } else if (newFactor <= 0) {
          // Going backwards, move to previous transformation
          newIndex--;
          if (newIndex < 0) {
            // Reached beginning
            newIndex = 0;
            newFactor = 0;
            setIsPlaying(false);
          } else {
            newFactor = 1;
          }
        }

        setCurrentTransformationIndex(newIndex);
        setInterpolationFactor(Math.max(0, Math.min(1, newFactor)));
        updateNodePositions();
      }

      // Hover detection
      raycaster.setFromCamera(mouse, cameraInstance);
      const intersects = raycaster.intersectObjects(nodeMeshes);
      if (intersects.length > 0) {
        const { label, coordinates } = intersects[0].object.userData;
        setHoveredNodeInfo({ label, coordinates });
      } else {
        setHoveredNodeInfo(null);
      }

      rendererInstance.render(scene, cameraInstance);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    onCleanup(() => {
      window.removeEventListener("mousemove", onMouseMove);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      rendererInstance.dispose();
      controls.dispose();
    });
  });

  const handlePlayPause = () => {
    const wasPlaying = isPlaying();
    setIsPlaying(!wasPlaying);
  };

  const handleDirectionToggle = () => {
    setPlaybackDirection((d) => (d === 1 ? -1 : 1));
  };

  const handleSpeedChange = (value: number[]) => {
    setPlaybackSpeed(value[0]);
  };

  const handleScrub = (
    index: number,
    factor: number,
    _scene: THREE.Scene,
    _renderer: THREE.WebGLRenderer,
    _camera: THREE.PerspectiveCamera
  ) => {
    setIsPlaying(false);
    setCurrentTransformationIndex(index);
    setInterpolationFactor(factor);
    updateNodePositions();
  };

  return (
    <Card class="relative overflow-hidden">
      <div
        ref={(el) => (containerRef = el)}
        class="rounded-t-lg"
        style={{ width: `${props.width}px`, height: `${props.height}px` }}
      />

      {/* Hover info overlay */}
      {hoveredNodeInfo() && (
        <div class="absolute top-4 left-4 rounded-lg border bg-card/95 backdrop-blur p-3 shadow-lg">
          <p class="font-semibold text-sm">{hoveredNodeInfo()!.label}</p>
          <p class="text-xs text-muted-foreground font-mono">
            ({hoveredNodeInfo()!.coordinates.map((c: number) => c.toFixed(2)).join(", ")})
          </p>
        </div>
      )}

      {/* Controls panel */}
      <div class="absolute top-4 right-4 flex flex-col gap-3 rounded-lg border bg-card/95 backdrop-blur p-3 shadow-lg">
        <Switch checked={showGrid()} onChange={setShowGrid}>
          <SwitchControl />
          <SwitchLabel class="text-sm">Grid</SwitchLabel>
        </Switch>
        <Switch checked={showSpheres()} onChange={setShowSpheres}>
          <SwitchControl />
          <SwitchLabel class="text-sm">Spheres</SwitchLabel>
        </Switch>
        <Switch checked={showIntersections()} onChange={setShowIntersections}>
          <SwitchControl />
          <SwitchLabel class="text-sm">Intersections</SwitchLabel>
        </Switch>
      </div>

      {/* Playback controls */}
      <div class="border-t p-4">
        <div class="flex items-center gap-3 mb-3">
          <Button
            size="sm"
            variant={isPlaying() ? "secondary" : "default"}
            onClick={handlePlayPause}
          >
            {isPlaying() ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="size-4"
              >
                <path
                  fill-rule="evenodd"
                  d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
                  clip-rule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="size-4"
              >
                <path
                  fill-rule="evenodd"
                  d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                  clip-rule="evenodd"
                />
              </svg>
            )}
          </Button>
          <Button size="sm" variant="outline" onClick={handleDirectionToggle}>
            {playbackDirection() > 0 ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="size-4"
              >
                <path
                  fill-rule="evenodd"
                  d="M13.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L11.69 12 4.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z"
                  clip-rule="evenodd"
                />
                <path
                  fill-rule="evenodd"
                  d="M19.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 11-1.06-1.06L17.69 12l-6.97-6.97a.75.75 0 011.06-1.06l7.5 7.5z"
                  clip-rule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="size-4"
              >
                <path
                  fill-rule="evenodd"
                  d="M10.72 11.47a.75.75 0 000 1.06l7.5 7.5a.75.75 0 101.06-1.06L12.31 12l6.97-6.97a.75.75 0 00-1.06-1.06l-7.5 7.5z"
                  clip-rule="evenodd"
                />
                <path
                  fill-rule="evenodd"
                  d="M4.72 11.47a.75.75 0 000 1.06l7.5 7.5a.75.75 0 101.06-1.06L6.31 12l6.97-6.97a.75.75 0 00-1.06-1.06l-7.5 7.5z"
                  clip-rule="evenodd"
                />
              </svg>
            )}
          </Button>
          <div class="w-32">
            <Slider
              minValue={0.1}
              maxValue={2}
              step={0.1}
              value={[playbackSpeed()]}
              onChange={handleSpeedChange}
              label="Speed"
            />
          </div>
        </div>
        <Timeline
          transformations={transformations.length}
          currentIndex={currentTransformationIndex}
          interpolationFactor={interpolationFactor}
          scene={scene}
          renderer={renderer()}
          camera={camera()}
          onScrub={handleScrub}
        />
      </div>
    </Card>
  );
}
