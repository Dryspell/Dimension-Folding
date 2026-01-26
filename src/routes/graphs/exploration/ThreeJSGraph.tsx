// ThreeJSGraph.tsx
import { onMount, createSignal, Setter, createEffect, onCleanup, createMemo, For, Show } from "solid-js";
import Timeline from "./Timeline";
import * as THREE from "three";
import Graph from "graphology";
import {
  addAxesHelper,
  addGridHelpers,
  addLighting,
  createGradientBackground,
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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "~/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { Badge } from "~/components/ui/badge";

interface ThreeJSGraphProps {
  graph: Graph;
  width: number;
  height: number;
  setCoordinates: Setter<{
    [key: string]: [number, number, number];
  }>;
  /** Callback when target dimension changes (for folding metrics) */
  onTargetDimensionChange?: (dimension: number | null) => void;
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
        // Vibrant orange for motion arcs - stands out on light background
        const arcColor = 0xf97316; // Orange-500
        const line = createArcVisualization(scene, arc, arcColor, 48);
        arcLines.push(line);
        
        const arrow = createArcArrow(scene, arc, arcColor);
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
    
    // Notify parent of target dimension change
    props.onTargetDimensionChange?.(targetDimension);
    
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
    
    // Notify parent that target dimension is cleared
    props.onTargetDimensionChange?.(null);

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

    addLighting(scene);
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
    <Card class="overflow-hidden">
      <CardHeader class="pb-2 border-b">
        <div class="flex items-center justify-between">
          <div>
            <CardTitle class="text-base">3D Linkage View</CardTitle>
            <CardDescription class="text-xs">
              Interactive visualization with constraint spheres
            </CardDescription>
          </div>
          <div class="flex items-center gap-2">
            <Show when={hasTransformations()}>
              <Badge variant="secondary" class="text-xs">
                {currentTransformName()}
              </Badge>
            </Show>
          </div>
        </div>
      </CardHeader>
      
      {/* 3D Canvas container */}
      <div class="relative bg-gradient-to-br from-slate-50 to-slate-100 border-b">
        <div
          ref={(el) => (containerRef = el)}
          class="mx-auto"
          style={{ width: `${props.width}px`, height: `${props.height}px` }}
        />

        {/* Hover info overlay */}
        <Show when={hoveredNodeInfo()}>
          <div class="absolute top-3 left-3 rounded-lg border bg-white/95 backdrop-blur-sm px-3 py-2 shadow-md">
            <p class="font-semibold text-sm">{hoveredNodeInfo()!.label}</p>
            <p class="text-xs text-muted-foreground font-mono">
              ({hoveredNodeInfo()!.coordinates.map((c: number) => c.toFixed(2)).join(", ")})
            </p>
          </div>
        </Show>

        {/* Controls panel - compact floating */}
        <div class="absolute top-3 right-3 rounded-lg border bg-white/95 backdrop-blur-sm shadow-md overflow-hidden">
          <div class="p-2.5 space-y-2">
            <Switch checked={showGrid()} onChange={setShowGrid}>
              <SwitchControl class="scale-75" />
              <SwitchLabel class="text-xs flex items-center gap-1.5 cursor-pointer text-slate-600">
                Grid
              </SwitchLabel>
            </Switch>
            <Switch checked={showSpheres()} onChange={setShowSpheres}>
              <SwitchControl class="scale-75" />
              <SwitchLabel class="text-xs flex items-center gap-1.5 cursor-pointer text-blue-600">
                Spheres
              </SwitchLabel>
            </Switch>
            <Switch checked={showIntersections()} onChange={setShowIntersections}>
              <SwitchControl class="scale-75" />
              <SwitchLabel class="text-xs flex items-center gap-1.5 cursor-pointer text-cyan-600">
                Intersections
              </SwitchLabel>
            </Switch>
          </div>
        </div>
        
        {/* Keyboard shortcuts hint */}
        <Show when={hasTransformations()}>
          <div class="absolute bottom-3 left-3 text-xs text-slate-400 bg-white/70 px-2 py-1 rounded">
            Space: play/pause | R: reset | ←→: direction
          </div>
        </Show>
      </div>

      {/* Folding controls */}
      <div class="border-t p-3 bg-muted/30">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fold to:</span>
          <div class="flex gap-1">
            <Button
              size="sm"
              variant={hasTransformations() ? "outline" : "default"}
              class="h-7 text-xs"
              onClick={() => generateTransformations(2)}
              disabled={isPlaying()}
            >
              2D Plane
            </Button>
            <Button
              size="sm"
              variant={hasTransformations() ? "outline" : "default"}
              class="h-7 text-xs"
              onClick={() => generateTransformations(1)}
              disabled={isPlaying()}
            >
              1D Line
            </Button>
          </div>
          <Show when={hasTransformations()}>
            <div class="flex items-center gap-2 ml-auto">
              <Badge variant="outline" class="text-xs">
                {transformationCount()} step{transformationCount() > 1 ? "s" : ""}
              </Badge>
              <Button size="sm" variant="ghost" class="h-7 text-xs" onClick={clearTransformations} disabled={isPlaying()}>
                Reset
              </Button>
            </div>
          </Show>
        </div>
      </div>

      {/* Transformation list for inspection */}
      <Show when={hasTransformations()}>
        <div class="border-t p-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Steps</span>
          </div>
          <div class="space-y-1.5 max-h-48 overflow-y-auto">
            <For each={transformations()}>
              {(transform, index) => (
                <div
                  class={`p-2 rounded-md border cursor-pointer transition-all text-xs ${
                    selectedTransformIndex() === index() 
                      ? "border-primary bg-primary/10 shadow-sm" 
                      : "border-transparent bg-muted/50 hover:bg-muted"
                  }`}
                  onClick={() => inspectTransformation(index())}
                >
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2 min-w-0">
                      <span class={`font-medium ${selectedTransformIndex() === index() ? "text-primary" : ""}`}>
                        {index() + 1}. {transform.name}
                      </span>
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                      <Badge variant="outline" class="text-[10px] h-5">
                        {transform.startDimension}→{transform.endDimension}D
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        class="h-5 w-5 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          inspectTransformation(index(), false);
                        }}
                        title="Jump to start"
                      >
                        ⏮
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        class="h-5 w-5 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          inspectTransformation(index(), true);
                        }}
                        title="Jump to end"
                      >
                        ⏭
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Playback controls */}
      <Show when={hasTransformations()}>
        <div class="border-t p-3 bg-muted/20">
          <div class="flex items-center gap-2 mb-2">
            <Button size="sm" variant="outline" class="h-8 w-8 p-0" onClick={handleReset} title="Reset (R)">
              ⏮
            </Button>
            <Button 
              size="sm" 
              variant={isPlaying() ? "secondary" : "default"} 
              class="h-8 w-8 p-0" 
              onClick={handlePlayPause} 
              title="Play/Pause (Space)"
            >
              {isPlaying() ? "⏸" : "▶"}
            </Button>
            <Button size="sm" variant="outline" class="h-8 w-8 p-0" onClick={handleDirectionToggle} title="Direction">
              {playbackDirection() > 0 ? "⏩" : "⏪"}
            </Button>
            <div class="flex-1" />
            <div class="flex items-center gap-2">
              <span class="text-xs text-muted-foreground">Speed</span>
              <div class="w-20">
                <Slider
                  minValue={0.25}
                  maxValue={2}
                  step={0.25}
                  value={[playbackSpeed()]}
                  onChange={handleSpeedChange}
                />
              </div>
              <span class="text-xs font-mono w-8">{playbackSpeed()}x</span>
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

      {/* Empty state hint */}
      <Show when={!hasTransformations()}>
        <div class="border-t p-3 text-center text-xs text-muted-foreground bg-muted/20">
          Select a target dimension above to animate the folding process
        </div>
      </Show>
    </Card>
  );
}
