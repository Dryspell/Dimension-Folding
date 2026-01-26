// ThreeJSGraph.tsx
import { onMount, createSignal, Setter, createEffect, onCleanup, createMemo, For, Show } from "solid-js";
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
  computeTransformationArcs,
  createArcVisualization,
  createArcArrow,
  interpolateArc,
  SphereArc,
} from "./threeUtils";
import { updateCoordinates } from "./matrixUtils";
import { 
  computeFoldingTransformations,
  FoldingTransformation,
} from "./dimensionFolding";
import { Button } from "~/components/ui/button";
import { Switch, SwitchControl, SwitchLabel } from "~/components/ui/switch";
import { Slider } from "~/components/ui/slider";
import { Card } from "~/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { Badge } from "~/components/ui/badge";

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

  // Scene objects (set once during mount)
  const [camera, setCamera] = createSignal<THREE.PerspectiveCamera | null>(null);
  const [renderer, setRenderer] = createSignal<THREE.WebGLRenderer | null>(null);

  // UI state
  const [hoveredNodeInfo, setHoveredNodeInfo] = createSignal<{
    label: string;
    coordinates: number[];
  } | null>(null);
  const [showGrid, setShowGrid] = createSignal(false);

  // Transformation-based playback state
  const [transformations, setTransformations] = createSignal<FoldingTransformation[]>([]);
  const [currentTransformIndex, setCurrentTransformIndex] = createSignal(0);
  const [interpolationFactor, setInterpolationFactor] = createSignal(0);
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [playbackSpeed, setPlaybackSpeed] = createSignal(1);
  const [playbackDirection, setPlaybackDirection] = createSignal<1 | -1>(1);

  // Selected transformation for inspection
  const [selectedTransformIndex, setSelectedTransformIndex] = createSignal<number | null>(null);

  // Visualization toggles
  const [showSpheres, setShowSpheres] = createSignal(true);
  const [showIntersections, setShowIntersections] = createSignal(true);

  // Scene object arrays (mutated during runtime)
  const spheres: THREE.Mesh[] = [];
  const circles: THREE.Mesh[] = [];
  const intersectionPoints: THREE.Mesh[] = [];

  // Arc visualization for transformations
  const arcLines: THREE.Line[] = [];
  const arcArrows: THREE.ArrowHelper[] = [];
  // Map of nodeLabel -> arc for the current transformation
  const [currentArcs, setCurrentArcs] = createSignal<Map<string, SphereArc>>(new Map());

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

  // Derived state
  const hasTransformations = createMemo(() => transformations().length > 0);
  const transformationCount = createMemo(() => transformations().length);
  
  const currentTransformation = createMemo(() => {
    const t = transformations();
    const idx = currentTransformIndex();
    if (t.length === 0 || idx >= t.length) return null;
    return t[idx];
  });

  const currentTransformName = createMemo(() => {
    const t = currentTransformation();
    if (!t) return "Initial";
    const factor = interpolationFactor();
    if (factor === 0) return t.name + " (start)";
    if (factor >= 0.99) return t.name + " (end)";
    return t.name;
  });

  // Effect to update sphere visibility - runs whenever showSpheres changes
  createEffect(() => {
    const visible = showSpheres();
    // Update all spheres in the array
    for (const sphere of spheres) {
      sphere.visible = visible;
    }
  });

  // Effect to update intersection visibility - runs whenever showIntersections changes
  createEffect(() => {
    const visible = showIntersections();
    // Update all circles and intersection points
    for (const circle of circles) {
      circle.visible = visible;
    }
    for (const point of intersectionPoints) {
      point.visible = visible;
    }
  });

  /**
   * Get the initial positions from meshes as a label->position map.
   */
  function getInitialPositions(): { [label: string]: [number, number, number] } {
    const positions: { [label: string]: [number, number, number] } = {};
    props.graph.forEachNode((nodeId, attr) => {
      const label = attr.label as string;
      const mesh = nodeMeshMap[nodeId];
      if (mesh) {
        const orig = originalPositions[nodeMeshes.indexOf(mesh)];
        if (orig) {
          positions[label] = [orig.x, orig.y, orig.z];
        }
      }
    });
    return positions;
  }

  /**
   * Updates all node positions by interpolating within current transformation.
   */
  function updateNodePositions() {
    const t = transformations();
    const idx = currentTransformIndex();
    const factor = interpolationFactor();
    const arcs = currentArcs();

    // If no transformations, use original positions
    if (t.length === 0) {
      nodeMeshes.forEach((mesh, i) => {
        mesh.position.copy(originalPositions[i]);
        mesh.userData.coordinates = [originalPositions[i].x, originalPositions[i].y, originalPositions[i].z];
      });
    } else if (idx < t.length) {
      // Interpolate between start and end of current transformation
      const transform = t[idx];

      props.graph.forEachNode((nodeId, attr) => {
        const label = attr.label as string;
        const mesh = nodeMeshMap[nodeId];
        if (!mesh) return;

        const p1 = transform.startPositions[label];
        const p2 = transform.endPositions[label];
        if (!p1 || !p2) return;

        // Check if this node has an arc - use arc interpolation for constraint-preserving motion
        const arc = arcs.get(label);
        if (arc) {
          // Interpolate along the sphere arc (constraint-preserving)
          const pos = interpolateArc(arc, factor);
          mesh.position.copy(pos);
          mesh.userData.coordinates = [pos.x, pos.y, pos.z];
        } else {
          // Linear interpolation for nodes without arcs (stationary or rigid motion)
          const x = p1[0] + (p2[0] - p1[0]) * factor;
          const y = p1[1] + (p2[1] - p1[1]) * factor;
          const z = p1[2] + (p2[2] - p1[2]) * factor;

          mesh.position.set(x, y, z);
          mesh.userData.coordinates = [x, y, z];
        }
      });
    }

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

  /**
   * Generate folding transformations for target dimension.
   */
  /**
   * Clear existing arc visualizations.
   */
  function clearArcs() {
    arcLines.forEach(line => {
      scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });
    arcLines.length = 0;
    
    arcArrows.forEach(arrow => {
      scene.remove(arrow);
    });
    arcArrows.length = 0;
    
    setCurrentArcs(new Map());
  }

  /**
   * Draw arcs for a specific transformation.
   */
  function drawTransformationArcs(transform: FoldingTransformation) {
    clearArcs();
    
    // Compute arcs for this transformation
    const arcData = computeTransformationArcs(
      props.graph,
      nodeMeshMap,
      transform.startPositions,
      transform.endPositions
    );
    
    // Create arc visualizations
    const arcMap = new Map<string, SphereArc>();
    
    arcData.forEach(({ nodeLabel, arc }) => {
      // Only draw arc if the angle is significant
      if (arc.angle > 0.01) {
        const line = createArcVisualization(scene, arc, 0xff6600, 48);
        arcLines.push(line);
        
        const arrow = createArcArrow(scene, arc, 0xff6600);
        arcArrows.push(arrow);
        
        arcMap.set(nodeLabel, arc);
      }
    });
    
    setCurrentArcs(arcMap);
  }

  function generateTransformations(targetDimension: 1 | 2) {
    const startPositions = getInitialPositions();
    const result = computeFoldingTransformations(props.graph, startPositions, targetDimension);

    if (result.transformations.length === 0) {
      console.log("No transformations generated:", result.explanation);
      return;
    }

    setTransformations(result.transformations);
    setCurrentTransformIndex(0);
    setInterpolationFactor(0);
    setSelectedTransformIndex(null);
    setPlaybackDirection(1);
    
    // Draw arcs for the first transformation
    if (result.transformations.length > 0) {
      drawTransformationArcs(result.transformations[0]);
    }
    
    setIsPlaying(true);
    updateNodePositions();
  }

  /**
   * Clear transformations and reset to original.
   */
  function clearTransformations() {
    clearArcs();
    setTransformations([]);
    setCurrentTransformIndex(0);
    setInterpolationFactor(0);
    setSelectedTransformIndex(null);
    setIsPlaying(false);

    nodeMeshes.forEach((mesh, i) => {
      mesh.position.copy(originalPositions[i]);
      mesh.userData.coordinates = [originalPositions[i].x, originalPositions[i].y, originalPositions[i].z];
    });

    props.setCoordinates(updateCoordinates(props.graph, nodeMeshMap));
    updateEdges(props.graph, nodeMeshMap, edges);
    updateSpheresAndIntersections(scene, props.graph, nodeMeshMap, spheres, circles, intersectionPoints);
  }

  /**
   * Jump to a specific transformation for inspection.
   */
  function inspectTransformation(index: number, showEnd: boolean = false) {
    setIsPlaying(false);
    setCurrentTransformIndex(index);
    setInterpolationFactor(showEnd ? 1 : 0);
    setSelectedTransformIndex(index);
    
    // Draw arcs for the selected transformation
    const t = transformations();
    if (index < t.length) {
      drawTransformationArcs(t[index]);
    }
    
    updateNodePositions();
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

    populateGraphScene(props.graph, originalPositions, nodeMeshes, nodeMeshMap, scene);
    drawEdges(props.graph, nodeMeshMap, scene, edges);
    createSpheresAndIntersections(props.graph, nodeMeshMap, scene, spheres, circles, intersectionPoints);

    props.setCoordinates(updateCoordinates(props.graph, nodeMeshMap));

    const onMouseMove = (event: MouseEvent) => {
      const rect = rendererInstance.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };
    window.addEventListener("mousemove", onMouseMove);

    // Main animation loop
    const animate = () => {
      controls.update();

      // Handle playback
      if (isPlaying() && transformations().length > 0) {
        const t = transformations();
        const direction = playbackDirection();
        const speed = playbackSpeed();
        const stepSize = direction * speed * 0.015;

        let newFactor = interpolationFactor() + stepSize;
        let newIndex = currentTransformIndex();
        const oldIndex = currentTransformIndex();

        if (newFactor >= 1) {
          newIndex++;
          if (newIndex >= t.length) {
            newIndex = t.length - 1;
            newFactor = 1;
            setIsPlaying(false);
          } else {
            newFactor = 0;
          }
        } else if (newFactor <= 0) {
          newIndex--;
          if (newIndex < 0) {
            newIndex = 0;
            newFactor = 0;
            setIsPlaying(false);
          } else {
            newFactor = 1;
          }
        }

        // Update arcs if transformation index changed
        if (newIndex !== oldIndex && newIndex < t.length) {
          drawTransformationArcs(t[newIndex]);
        }

        setCurrentTransformIndex(newIndex);
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

    onCleanup(() => {
      window.removeEventListener("mousemove", onMouseMove);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      rendererInstance.dispose();
      controls.dispose();
    });
  });

  const handlePlayPause = () => {
    if (transformations().length === 0) return;
    setIsPlaying(!isPlaying());
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
    if (transformations().length === 0) return;
    setIsPlaying(false);
    setCurrentTransformIndex(index);
    setInterpolationFactor(factor);
    updateNodePositions();
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTransformIndex(0);
    setInterpolationFactor(0);
    updateNodePositions();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    switch (e.code) {
      case "Space":
        e.preventDefault();
        handlePlayPause();
        break;
      case "KeyR":
        e.preventDefault();
        handleReset();
        break;
      case "ArrowLeft":
        e.preventDefault();
        setPlaybackDirection(-1);
        break;
      case "ArrowRight":
        e.preventDefault();
        setPlaybackDirection(1);
        break;
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("keydown", handleKeyDown);
    onCleanup(() => window.removeEventListener("keydown", handleKeyDown));
  }

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
      <div class="absolute top-4 right-4 rounded-lg border bg-card/95 backdrop-blur shadow-lg overflow-hidden min-w-[180px]">
        <div class="px-3 py-2 border-b bg-muted/50">
          <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Visibility</span>
        </div>
        <div class="p-3 space-y-3">
          <Switch checked={showGrid()} onChange={setShowGrid}>
            <SwitchControl />
            <SwitchLabel class="text-sm flex items-center gap-2 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4 text-muted-foreground">
                <path fill-rule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v11.5A2.25 2.25 0 004.25 18h11.5A2.25 2.25 0 0018 15.75V4.25A2.25 2.25 0 0015.75 2H4.25zM3.5 8.25v-4A.75.75 0 014.25 3.5h4V8.25H3.5zm0 1.5v2.5h4.75v-2.5H3.5zm0 4v2a.75.75 0 00.75.75h4v-2.75H3.5zm6.25 2.75h2.5v-2.75h-2.5v2.75zm4 0h2a.75.75 0 00.75-.75v-2h-2.75v2.75zm2.75-4.25h-2.75v-2.5h2.75v2.5zm0-4h-2.75V3.5h2a.75.75 0 01.75.75v4zm-4.25-4.75h-2.5V8.25h2.5V3.5zm0 6.25h-2.5v2.5h2.5v-2.5z" clip-rule="evenodd" />
              </svg>
              Grid
            </SwitchLabel>
          </Switch>
          <Switch checked={showSpheres()} onChange={setShowSpheres}>
            <SwitchControl />
            <SwitchLabel class="text-sm flex items-center gap-2 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4 text-blue-400">
                <path d="M10 1a9 9 0 100 18 9 9 0 000-18zM3 10a7 7 0 1114 0 7 7 0 01-14 0z" />
              </svg>
              Spheres
            </SwitchLabel>
          </Switch>
          <Switch checked={showIntersections()} onChange={setShowIntersections}>
            <SwitchControl />
            <SwitchLabel class="text-sm flex items-center gap-2 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4 text-cyan-400">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 112 0v4a1 1 0 11-2 0v-4zm1-5a1 1 0 100 2 1 1 0 000-2z" clip-rule="evenodd" />
              </svg>
              Intersections
            </SwitchLabel>
          </Switch>
        </div>
      </div>

      {/* Folding controls */}
      <div class="border-t p-4">
        <div class="flex items-center gap-3">
          <span class="text-sm font-medium text-muted-foreground">Fold to:</span>
          <Tooltip>
            <TooltipTrigger>
              <Button
                size="sm"
                variant="outline"
                onClick={() => generateTransformations(2)}
                disabled={isPlaying()}
              >
                2D (Plane)
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Generate transformations to fold to a 2D plane</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <Button
                size="sm"
                variant="outline"
                onClick={() => generateTransformations(1)}
                disabled={isPlaying()}
              >
                1D (Line)
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Generate transformations to fold to a 1D line</p>
            </TooltipContent>
          </Tooltip>
          <Show when={hasTransformations()}>
            <Button size="sm" variant="ghost" onClick={clearTransformations} disabled={isPlaying()}>
              Clear
            </Button>
            <span class="text-xs text-muted-foreground">
              {transformationCount()} transformation{transformationCount() > 1 ? "s" : ""}
            </span>
          </Show>
        </div>
      </div>

      {/* Transformation list for inspection */}
      <Show when={hasTransformations()}>
        <div class="border-t p-4">
          <h4 class="text-sm font-medium mb-3">Transformations</h4>
          <div class="space-y-2">
            <For each={transformations()}>
              {(transform, index) => (
                <div
                  class={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTransformIndex() === index() 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => inspectTransformation(index())}
                >
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-medium text-sm">{transform.name}</span>
                    <Badge variant={transform.type === "rigid" ? "secondary" : "default"}>
                      {transform.type === "rigid" ? "Rigid" : "Internal DOF"}
                    </Badge>
                  </div>
                  <p class="text-xs text-muted-foreground">{transform.description}</p>
                  <div class="flex gap-2 mt-2">
                    <Badge variant="outline" class="text-xs">
                      {transform.startDimension}D → {transform.endDimension}D
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      class="h-5 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        inspectTransformation(index(), false);
                      }}
                    >
                      Start
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      class="h-5 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        inspectTransformation(index(), true);
                      }}
                    >
                      End
                    </Button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Playback controls */}
      <Show when={hasTransformations()}>
        <div class="border-t p-4">
          <div class="flex items-center gap-3 mb-3">
            <Button size="sm" variant="outline" onClick={handleReset} title="Reset (R)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4">
                <path fill-rule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z" clip-rule="evenodd" />
              </svg>
            </Button>
            <Button size="sm" variant={isPlaying() ? "secondary" : "default"} onClick={handlePlayPause} title="Play/Pause (Space)">
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
              {playbackDirection() > 0 ? (
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
            <div class="flex-1 px-3 py-1.5 rounded-md bg-muted text-sm font-medium text-center min-w-[150px]">
              {currentTransformName()}
            </div>
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
            transformations={transformationCount()}
            keyframeNames={transformations().map(t => t.name)}
            currentIndex={currentTransformIndex}
            interpolationFactor={interpolationFactor}
            scene={scene}
            renderer={renderer()}
            camera={camera()}
            onScrub={handleScrub}
          />
        </div>
      </Show>

      {/* Empty state */}
      <Show when={!hasTransformations()}>
        <div class="border-t p-4 text-center text-sm text-muted-foreground">
          Click "2D (Plane)" or "1D (Line)" to generate folding transformations
        </div>
      </Show>
    </Card>
  );
}
