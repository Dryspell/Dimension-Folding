// FoldingMetricsPanel.tsx - Displays real-time folding metrics
import { Accessor, createMemo, Show, For } from "solid-js";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { 
  analyzeVolumes, 
  analyzeTangency, 
  CMAnalysis, 
  TangencyInfo,
  Coordinates 
} from "./cayleyMenger";
import { FrameworkGraph } from "./graphUtils";

interface FoldingMetricsPanelProps {
  graph: Accessor<FrameworkGraph>;
  coordinates: Accessor<Coordinates>;
  initialCoordinates: Accessor<Coordinates | null>;
  targetDimension: Accessor<number | null>;
}

/**
 * Panel displaying real-time folding metrics including Cayley-Menger volumes,
 * tangency gaps, and dimension progress.
 */
export default function FoldingMetricsPanel(props: FoldingMetricsPanelProps) {
  // Compute volume analysis from current coordinates
  const volumeAnalysis = createMemo<CMAnalysis | null>(() => {
    const coords = props.coordinates();
    if (Object.keys(coords).length < 2) return null;
    
    const initial = props.initialCoordinates();
    return analyzeVolumes(coords, initial || undefined);
  });

  // Compute tangency information
  const tangencyInfo = createMemo<TangencyInfo[]>(() => {
    const coords = props.coordinates();
    const graph = props.graph();
    
    if (Object.keys(coords).length < 2) return [];

    // Build node neighbors map
    const nodeNeighbors: { [label: string]: string[] } = {};
    graph.forEachNode((nodeId, attr) => {
      const label = attr.label as string;
      const neighbors: string[] = [];
      graph.forEachNeighbor(nodeId, (neighborId, neighborAttr) => {
        neighbors.push(neighborAttr.label as string);
      });
      nodeNeighbors[label] = neighbors;
    });

    return analyzeTangency(coords, nodeNeighbors);
  });

  // Get the most relevant tangency (closest to tangent)
  const nearestTangency = createMemo<TangencyInfo | null>(() => {
    const info = tangencyInfo();
    if (info.length === 0) return null;
    
    // Sort by normalized gap (smallest = closest to tangent)
    const sorted = [...info].sort((a, b) => a.normalizedGap - b.normalizedGap);
    return sorted[0];
  });

  const dimensionLabel = (d: number): string => {
    switch (d) {
      case 0: return "0D";
      case 1: return "1D";
      case 2: return "2D";
      case 3: return "3D";
      default: return `${d}D`;
    }
  };

  const formatNumber = (n: number, decimals: number = 2): string => {
    if (Math.abs(n) < 0.001) return "~0";
    return n.toFixed(decimals);
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 0.9) return "text-green-500";
    if (progress >= 0.5) return "text-yellow-500";
    return "text-muted-foreground";
  };

  const getTangencyStatusColor = (gap: number): string => {
    if (Math.abs(gap) < 0.05) return "text-red-500"; // Tangent
    if (gap < -0.2) return "text-cyan-500"; // Transverse
    return "text-orange-500"; // Near-tangent
  };

  return (
    <Card class="h-fit">
      <CardHeader class="pb-3">
        <CardTitle class="text-base flex items-center gap-2">
          Folding Metrics
          <Tooltip>
            <TooltipTrigger>
              <span class="text-muted-foreground text-xs cursor-help">(?)</span>
            </TooltipTrigger>
            <TooltipContent class="max-w-xs">
              <p class="text-sm">
                Real-time metrics tracking progress toward dimensional reduction.
                Volume approaching 0 indicates approaching a lower-dimensional configuration.
              </p>
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        {/* Current vs Target Dimension */}
        <div class="rounded-lg border p-3 bg-muted/30">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs text-muted-foreground uppercase tracking-wide block">
                Current
              </span>
              <span class="text-lg font-bold">
                {volumeAnalysis() ? dimensionLabel(volumeAnalysis()!.currentDimension) : "--"}
              </span>
            </div>
            <Show when={props.targetDimension() !== null}>
              <div class="text-muted-foreground px-2">→</div>
              <div class="text-right">
                <span class="text-xs text-muted-foreground uppercase tracking-wide block">
                  Target
                </span>
                <span class="text-lg font-bold text-primary">
                  {dimensionLabel(props.targetDimension()!)}
                </span>
              </div>
            </Show>
          </div>
        </div>

        {/* Dimension Path Visualization */}
        <div class="flex items-center justify-center gap-2 py-2">
          <For each={[3, 2, 1]}>
            {(dim) => {
              const isCurrent = volumeAnalysis()?.currentDimension === dim;
              const isTarget = props.targetDimension() === dim;
              const isPast = (volumeAnalysis()?.currentDimension ?? 3) > dim;
              
              return (
                <>
                  <div 
                    class={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors
                      ${isCurrent ? "bg-primary text-primary-foreground" : ""}
                      ${isTarget && !isCurrent ? "bg-primary/20 text-primary border-2 border-primary" : ""}
                      ${!isCurrent && !isTarget ? "bg-muted text-muted-foreground" : ""}
                    `}
                  >
                    {dim}D
                  </div>
                  <Show when={dim > 1}>
                    <div class={`w-6 h-0.5 ${isPast ? "bg-primary" : "bg-muted"}`} />
                  </Show>
                </>
              );
            }}
          </For>
        </div>

        {/* Volume Progress */}
        <Show when={volumeAnalysis()}>
          {(analysis) => (
            <div class="rounded-lg border p-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs text-muted-foreground uppercase tracking-wide">
                  {analysis().currentDimension >= 3 ? "Tetrahedron Volume" : "Triangle Area"}
                </span>
                <span class={`text-sm font-mono ${getProgressColor(analysis().progress)}`}>
                  {formatNumber(analysis().maxVolume)}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div class="relative h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  class="absolute inset-y-0 left-0 bg-primary transition-all duration-300"
                  style={{ width: `${Math.round(analysis().progress * 100)}%` }}
                />
              </div>
              <div class="flex justify-between mt-1">
                <span class="text-xs text-muted-foreground">Initial</span>
                <span class={`text-xs font-medium ${getProgressColor(analysis().progress)}`}>
                  {Math.round(analysis().progress * 100)}% collapsed
                </span>
                <span class="text-xs text-muted-foreground">Target</span>
              </div>
            </div>
          )}
        </Show>

        {/* Cayley-Menger Details */}
        <Show when={volumeAnalysis()}>
          {(analysis) => (
            <div class="rounded-lg border p-3 space-y-2">
              <span class="text-xs text-muted-foreground uppercase tracking-wide block">
                Cayley-Menger Determinants
              </span>
              
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span class="text-muted-foreground">CM₃ (area²):</span>
                </div>
                <div class="font-mono text-right">
                  {formatNumber(analysis().collinearityDet, 4)}
                </div>
                
                <Show when={analysis().coplanarityDet !== null}>
                  <div>
                    <span class="text-muted-foreground">CM₄ (vol²):</span>
                  </div>
                  <div class="font-mono text-right">
                    {formatNumber(analysis().coplanarityDet!, 4)}
                  </div>
                </Show>
              </div>
              
              <p class="text-xs text-muted-foreground">
                CM → 0 indicates dimensional collapse
              </p>
            </div>
          )}
        </Show>

        {/* Tangency Gaps */}
        <Show when={tangencyInfo().length > 0}>
          <div class="rounded-lg border p-3">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-muted-foreground uppercase tracking-wide">
                Tangency Gaps
              </span>
              <Badge variant="outline" class="text-xs">
                {tangencyInfo().filter(t => t.isTangent).length}/{tangencyInfo().length} tangent
              </Badge>
            </div>
            
            <div class="space-y-2 max-h-32 overflow-y-auto">
              <For each={tangencyInfo().slice(0, 4)}>
                {(info) => (
                  <div class="flex items-center justify-between text-xs">
                    <div class="flex items-center gap-1">
                      <span class="text-muted-foreground">
                        S({info.sphere1Center})-S({info.sphere2Center})
                      </span>
                      <span class="text-muted-foreground">→</span>
                      <span>{info.constrainedNode}</span>
                    </div>
                    <div class={`font-mono ${getTangencyStatusColor(info.tangencyGap)}`}>
                      {info.isTangent ? "tangent" : 
                       info.isTransverse ? formatNumber(info.tangencyGap) : 
                       formatNumber(info.tangencyGap)}
                    </div>
                  </div>
                )}
              </For>
              <Show when={tangencyInfo().length > 4}>
                <div class="text-xs text-muted-foreground">
                  +{tangencyInfo().length - 4} more sphere pairs
                </div>
              </Show>
            </div>
            
            {/* Nearest to tangency indicator */}
            <Show when={nearestTangency()}>
              {(nearest) => (
                <div class="mt-2 pt-2 border-t">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-muted-foreground">Nearest to tangency:</span>
                    <span class={getTangencyStatusColor(nearest().tangencyGap)}>
                      {nearest().constrainedNode} ({formatNumber(Math.abs(nearest().tangencyGap))} away)
                    </span>
                  </div>
                </div>
              )}
            </Show>
          </div>
        </Show>

        {/* Empty State */}
        <Show when={Object.keys(props.coordinates()).length < 2}>
          <div class="text-sm text-muted-foreground text-center py-4">
            Waiting for coordinate data...
          </div>
        </Show>
      </CardContent>
    </Card>
  );
}
