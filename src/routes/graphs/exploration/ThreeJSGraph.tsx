// ThreeJSGraph.tsx
import { onMount, createSignal, Setter, createEffect } from "solid-js";
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

export default function ThreeJSGraph(props: ThreeJSGraphProps) {
  let containerRef: HTMLDivElement | undefined;

  // Define signals for scene, camera, and renderer
  const [camera, setCamera] = createSignal<THREE.PerspectiveCamera | null>(null);
  const [renderer, setRenderer] = createSignal<THREE.WebGLRenderer | null>(null);

  const [hoveredNodeInfo, setHoveredNodeInfo] = createSignal<{
    label: string;
    coordinates: number[];
  } | null>(null);
  const [showGrid, setShowGrid] = createSignal(false);
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [timeDirection, setTimeDirection] = createSignal(1);
  const [currentTransformationIndex, setCurrentTransformationIndex] = createSignal(0);
  const [interpolationFactor, setInterpolationFactor] = createSignal(0);

  const [showSpheres, setShowSpheres] = createSignal(true);
  const [showIntersections, setShowIntersections] = createSignal(true);
  const spheres: THREE.Mesh[] = [];
  const circles: THREE.Mesh[] = [];
  const intersectionPoints: THREE.Mesh[] = [];

  const transformations = [
    new THREE.Matrix4().makeRotationY(Math.PI / 4),
    new THREE.Matrix4().makeScale(1.5, 1.5, 1.5),
    new THREE.Matrix4().makeRotationZ(Math.PI / 4),
    new THREE.Matrix4().makeTranslation(1, 0, 0),
  ];

  const initialPositions: THREE.Vector3[] = [];
  const targetPositions: THREE.Vector3[] = [];
  const nodeMeshes: THREE.Mesh[] = [];
  const nodeMeshMap: { [nodeId: string]: THREE.Mesh } = {};
  const edges: THREE.LineSegments[] = [];

  let animationFrameId: number | null = null;
  let mouse = new THREE.Vector2();
  let raycaster = new THREE.Raycaster();

  const scene = new THREE.Scene();
  const [animate, setAnimate] = createSignal(() => {});

  createEffect(() => {
    if (!containerRef || !spheres.length) return;

    spheres.forEach((sphere) => (sphere.visible = showSpheres()));
    updateSpheresAndIntersections(
      scene,
      props.graph,
      nodeMeshMap,
      spheres,
      circles,
      intersectionPoints
    );
  });

  createEffect(() => {
    if (!containerRef || !(circles.length || intersectionPoints.length)) return;

    circles.forEach((circle) => (circle.visible = showIntersections()));
    intersectionPoints.forEach((point) => (point.visible = showIntersections()));
    updateSpheresAndIntersections(
      scene,
      props.graph,
      nodeMeshMap,
      spheres,
      circles,
      intersectionPoints
    );
  });

  scene.rotation.x = -Math.PI / 2;

  onMount(() => {
    if (!containerRef) return;

    const { renderer, controls, camera } = initSceneAndControls(
      props.width,
      props.height,
      containerRef
    );
    setRenderer(renderer);
    setCamera(camera);

    addAxesHelper(scene);
    addGridHelpers(showGrid, scene);
    populateGraphScene(
      props.graph,
      initialPositions,
      targetPositions,
      nodeMeshes,
      nodeMeshMap,
      scene
    );
    props.setCoordinates(updateCoordinates(props.graph, nodeMeshMap));

    const onMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };
    window.addEventListener("mousemove", onMouseMove);

    drawEdges(props.graph, nodeMeshMap, scene, edges);
    createSpheresAndIntersections(
      props.graph,
      nodeMeshMap,
      scene,
      spheres,
      circles,
      intersectionPoints
    );

    const animate = () => {
      controls.update();

      if (isPlaying()) {
        let factor = interpolationFactor() + timeDirection() * 0.02;
        if (factor > 1) factor = 1;
        if (factor < 0) factor = 0;
        setInterpolationFactor(factor);

        if (factor === 1 || factor === 0) {
          let newIndex = currentTransformationIndex() + (timeDirection() > 0 ? 1 : -1);

          if (newIndex >= transformations.length || newIndex < 0) {
            setIsPlaying(false);
            return;
          }

          if (newIndex < transformations.length && newIndex >= 0) {
            setInterpolationFactor(timeDirection() > 0 ? 0 : 1);
          }

          setCurrentTransformationIndex(newIndex);

          nodeMeshes.forEach((node, index) => {
            initialPositions[index].copy(node.position);
            targetPositions[index]
              .copy(initialPositions[index])
              .applyMatrix4(transformations[newIndex]);
          });
        }

        nodeMeshes.forEach((node, index) => {
          node.position.lerpVectors(
            initialPositions[index],
            targetPositions[index],
            Math.abs(interpolationFactor())
          );
        });

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

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes);
      if (intersects.length > 0) {
        const { label, coordinates } = intersects[0].object.userData;
        setHoveredNodeInfo({ label, coordinates });
      } else {
        setHoveredNodeInfo(null);
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    setAnimate(() => animate);
    animate();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      controls.dispose();
    };
  });

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying());
    if (!isPlaying()) {
      setInterpolationFactor(timeDirection() > 0 ? 0 : 1);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    } else {
      animate()();
    }
  };

  const handleDirectionToggle = () => {
    setTimeDirection(-timeDirection());
    if (isPlaying()) setInterpolationFactor(timeDirection() > 0 ? 0 : 1);
  };

  const handleSpeedChange = (value: number[]) => {
    const speed = value[0];
    setTimeDirection(Math.sign(timeDirection()) * speed);
  };

  const handleScrub = (
    index: number,
    factor: number,
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    camera: THREE.PerspectiveCamera
  ) => {
    setCurrentTransformationIndex(index);
    setInterpolationFactor(factor);
    setIsPlaying(false);

    nodeMeshes.forEach((node, nodeIndex) => {
      node.position.copy(initialPositions[nodeIndex]);
    });

    nodeMeshes.forEach((node, nodeIndex) => {
      for (let i = 0; i < index; i++) {
        node.position.applyMatrix4(transformations[i]);
      }

      if (index < transformations.length) {
        const initialPosition = new THREE.Vector3().copy(node.position);
        const targetPosition = new THREE.Vector3()
          .copy(node.position)
          .applyMatrix4(transformations[index]);

        node.position.lerpVectors(initialPosition, targetPosition, factor);
      }
    });

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

    renderer.render(scene, camera);
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
            ({hoveredNodeInfo()!.coordinates.map((c) => c.toFixed(2)).join(", ")})
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
          <Button size="sm" variant={isPlaying() ? "secondary" : "default"} onClick={handlePlayPause}>
            {isPlaying() ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4">
                <path fill-rule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clip-rule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4">
                <path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" />
              </svg>
            )}
          </Button>
          <Button size="sm" variant="outline" onClick={handleDirectionToggle}>
            {timeDirection() > 0 ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4">
                <path fill-rule="evenodd" d="M13.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L11.69 12 4.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z" clip-rule="evenodd" />
                <path fill-rule="evenodd" d="M19.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 11-1.06-1.06L17.69 12l-6.97-6.97a.75.75 0 011.06-1.06l7.5 7.5z" clip-rule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4">
                <path fill-rule="evenodd" d="M10.72 11.47a.75.75 0 000 1.06l7.5 7.5a.75.75 0 101.06-1.06L12.31 12l6.97-6.97a.75.75 0 00-1.06-1.06l-7.5 7.5z" clip-rule="evenodd" />
                <path fill-rule="evenodd" d="M4.72 11.47a.75.75 0 000 1.06l7.5 7.5a.75.75 0 101.06-1.06L6.31 12l6.97-6.97a.75.75 0 00-1.06-1.06l-7.5 7.5z" clip-rule="evenodd" />
              </svg>
            )}
          </Button>
          <div class="w-32">
            <Slider
              minValue={0.1}
              maxValue={2}
              step={0.1}
              value={[Math.abs(timeDirection())]}
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
