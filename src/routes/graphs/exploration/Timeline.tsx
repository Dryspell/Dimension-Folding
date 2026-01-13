// Timeline.tsx
import { Accessor, createSignal, For } from "solid-js";
import type * as THREE from "three";
import { cn } from "~/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";

interface TimelineProps {
  transformations: number;
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
  const segmentWidth = 100 / props.transformations;
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

    const segmentRect = (e.target as HTMLElement).getBoundingClientRect();
    const segmentRelativeX = e.clientX - segmentRect.left;
    const segmentWidthPx = segmentRect.width;

    const timelineRect = timelineRef.getBoundingClientRect();
    const timelineRelativeX = e.clientX - timelineRect.left;

    const totalProgress = Math.max(0, Math.min(1, timelineRelativeX / timelineRect.width));

    const index = Math.floor(totalProgress * props.transformations);
    const factor = segmentRelativeX / segmentWidthPx;

    props.renderer &&
      props.camera &&
      props.onScrub(index, factor, props.scene, props.renderer, props.camera);
  };

  const transformationNames = ["Rotation Y", "Scale", "Rotation Z", "Translate X"];

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
        <For each={Array.from({ length: props.transformations })}>
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
                <p class="font-medium">{transformationNames[index()] || `Step ${index() + 1}`}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </For>

        {/* Overall progress bar */}
        <div
          class="absolute top-0 left-0 h-full bg-primary/30 pointer-events-none transition-all"
          style={{
            width: `${((props.currentIndex() + props.interpolationFactor()) / props.transformations) * 100}%`,
          }}
        />
      </div>

      {/* Progress info */}
      <div class="flex justify-between text-xs text-muted-foreground font-mono">
        <span>
          Step {props.currentIndex() + 1}/{props.transformations}
        </span>
        <span>
          {((props.currentIndex() + props.interpolationFactor()) / props.transformations * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
