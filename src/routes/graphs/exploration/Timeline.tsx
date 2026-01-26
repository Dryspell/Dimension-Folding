// Timeline.tsx
import { Accessor, createSignal, For } from "solid-js";
import type * as THREE from "three";
import { cn } from "~/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";

interface TimelineProps {
  /** Number of transitions (keyframes - 1) */
  transformations: number;
  /** Names for each keyframe */
  keyframeNames?: string[];
  currentIndex: Accessor<number>;
  interpolationFactor: Accessor<number>;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer | null;
  camera: THREE.PerspectiveCamera | null;
  onScrub: (
    index: number,
    factor: number,
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    camera: THREE.PerspectiveCamera
  ) => void;
}

export default function Timeline(props: TimelineProps) {
  const segmentCount = Math.max(1, props.transformations);
  const segmentWidth = 100 / segmentCount;
  const [isDragging, setIsDragging] = createSignal(false);
  let timelineRef: HTMLDivElement | null = null;

  const handleMouseDown = (e: MouseEvent) => {
    setIsDragging(true);
    updateScrubPosition(e);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging()) updateScrubPosition(e);
  };

  const handleMouseUp = () => setIsDragging(false);

  const updateScrubPosition = (e: MouseEvent) => {
    if (!timelineRef) return;

    const timelineRect = timelineRef.getBoundingClientRect();
    const timelineRelativeX = e.clientX - timelineRect.left;
    const totalProgress = Math.max(0, Math.min(1, timelineRelativeX / timelineRect.width));

    const rawIndex = totalProgress * segmentCount;
    const index = Math.min(Math.floor(rawIndex), segmentCount - 1);
    const factor = rawIndex - index;

    props.renderer &&
      props.camera &&
      props.onScrub(index, Math.max(0, Math.min(1, factor)), props.scene, props.renderer, props.camera);
  };

  /**
   * Get the name for a segment (transition between keyframes).
   */
  const getSegmentName = (index: number): string => {
    const names = props.keyframeNames || [];
    if (names.length > index) {
      const from = names[index] || `Frame ${index + 1}`;
      const to = names[index + 1] || `Frame ${index + 2}`;
      return `${from} → ${to}`;
    }
    return `Step ${index + 1}`;
  };

  return (
    <div class="space-y-2">
      <div
        ref={(el) => (timelineRef = el)}
        class="relative h-8 w-full rounded-md bg-secondary overflow-hidden cursor-pointer select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsDragging(false)}
      >
        <For each={Array.from({ length: segmentCount })}>
          {(_, index) => (
            <Tooltip>
              <TooltipTrigger
                as="div"
                class={cn(
                  "inline-block h-full transition-colors",
                  index() % 2 === 0 ? "bg-secondary" : "bg-secondary/70",
                  index() === props.currentIndex() && "bg-primary/20"
                )}
                style={{ width: `${segmentWidth}%` }}
              >
                {/* Current position indicator */}
                {index() === props.currentIndex() && (
                  <div
                    class="absolute top-0 h-full w-0.5 bg-primary shadow-sm"
                    style={{ left: `${props.interpolationFactor() * 100}%` }}
                  />
                )}
              </TooltipTrigger>
              <TooltipContent>
                <p class="font-medium">{getSegmentName(index())}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </For>

        {/* Overall progress bar */}
        <div
          class="absolute top-0 left-0 h-full bg-primary/30 pointer-events-none transition-all"
          style={{
            width: `${((props.currentIndex() + props.interpolationFactor()) / segmentCount) * 100}%`,
          }}
        />
      </div>

      {/* Progress info */}
      <div class="flex justify-between text-xs text-muted-foreground font-mono">
        <span>
          Frame {props.currentIndex() + 1}/{segmentCount + 1}
        </span>
        <span>
          {((props.currentIndex() + props.interpolationFactor()) / segmentCount * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
