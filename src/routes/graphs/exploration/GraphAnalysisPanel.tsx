// GraphAnalysisPanel.tsx - Displays matroid-derived graph analysis
import { Accessor, createMemo, Show, For } from "solid-js";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { analyzeRigidityMatroid, MatroidAnalysis } from "./matroidAnalysis";
import { FrameworkGraph } from "./graphUtils";

interface GraphAnalysisPanelProps {
  graph: Accessor<FrameworkGraph>;
  internalDOF: Accessor<number | null>;
  isRigid: Accessor<boolean | null>;
}

/**
 * Panel displaying combinatorial graph analysis based on rigidity matroid theory.
 * Shows d_min, clique information, Laman conditions, and circuits.
 */
export default function GraphAnalysisPanel(props: GraphAnalysisPanelProps) {
  const analysis = createMemo<MatroidAnalysis>(() => {
    return analyzeRigidityMatroid(props.graph());
  });

  const dimensionLabel = (d: number): string => {
    switch (d) {
      case 0: return "0D (point)";
      case 1: return "1D (line)";
      case 2: return "2D (plane)";
      case 3: return "3D (space)";
      default: return `${d}D`;
    }
  };

  const cliqueName = (k: number): string => {
    switch (k) {
      case 1: return "K₁";
      case 2: return "K₂ (edge)";
      case 3: return "K₃ (triangle)";
      case 4: return "K₄ (tetrahedron)";
      case 5: return "K₅ (5-simplex)";
      default: return `K${k}`;
    }
  };

  return (
    <Card class="h-fit">
      <CardHeader class="pb-3">
        <CardTitle class="text-base flex items-center gap-2">
          Graph Analysis
          <Tooltip>
            <TooltipTrigger>
              <span class="text-muted-foreground text-xs cursor-help">(?)</span>
            </TooltipTrigger>
            <TooltipContent class="max-w-xs">
              <p class="text-sm">
                Analysis of the graph's rigidity matroid. The minimal dimension d_min 
                is the smallest dimension where the linkage can be rigidly embedded.
              </p>
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        {/* Minimal Dimension */}
        <div class="rounded-lg border p-3 bg-muted/30">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-muted-foreground uppercase tracking-wide">
              Minimal Dimension
            </span>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="default" class="text-sm cursor-help">
                  d_min = {analysis().d_min}
                </Badge>
              </TooltipTrigger>
              <TooltipContent class="max-w-xs">
                <p class="text-sm">{analysis().lowerBoundReason || analysis().explanation}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p class="text-sm">
            Requires at least <strong>{dimensionLabel(analysis().d_min)}</strong>
          </p>
        </div>

        {/* Rigidity Status */}
        <div class="rounded-lg border p-3">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-muted-foreground uppercase tracking-wide">
              Rigidity
            </span>
            <Show when={props.isRigid() !== null}>
              <Badge variant={props.isRigid() ? "default" : "secondary"}>
                {props.isRigid() ? "Rigid" : "Flexible"}
              </Badge>
            </Show>
          </div>
          <Show when={props.internalDOF() !== null}>
            <p class="text-sm">
              <Show when={props.internalDOF()! > 0} fallback={
                <span>No internal degrees of freedom</span>
              }>
                <span class="font-medium">{props.internalDOF()}</span> internal DOF
              </Show>
            </p>
          </Show>
        </div>

        {/* Clique Information */}
        <div class="rounded-lg border p-3">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-muted-foreground uppercase tracking-wide">
              Largest Clique
            </span>
            <Badge variant="outline">
              ω(G) = {analysis().cliqueNumber}
            </Badge>
          </div>
          <p class="text-sm">
            Contains {cliqueName(analysis().cliqueNumber)}
          </p>
          <Show when={analysis().maxCliques.length > 0}>
            <div class="mt-2 text-xs text-muted-foreground">
              <For each={analysis().maxCliques.slice(0, 3)}>
                {(clique) => (
                  <span class="inline-block mr-2 px-1.5 py-0.5 bg-muted rounded">
                    {"{" + clique.join(", ") + "}"}
                  </span>
                )}
              </For>
              <Show when={analysis().maxCliques.length > 3}>
                <span class="text-muted-foreground">
                  +{analysis().maxCliques.length - 3} more
                </span>
              </Show>
            </div>
          </Show>
        </div>

        {/* Laman Status (2D Rigidity) */}
        <div class="rounded-lg border p-3">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-muted-foreground uppercase tracking-wide">
              Laman (2D)
            </span>
            <Badge variant={analysis().isLaman ? "default" : "outline"}>
              {analysis().isLaman ? "Yes" : "No"}
            </Badge>
          </div>
          <p class="text-xs text-muted-foreground">
            <Show when={analysis().isLaman} fallback={
              <>
                |E| = {props.graph().size}, need {2 * props.graph().order - 3} for Laman
              </>
            }>
              Minimally rigid in 2D
            </Show>
          </p>
        </div>

        {/* Circuits */}
        <Show when={analysis().circuits.length > 0}>
          <div class="rounded-lg border p-3">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs text-muted-foreground uppercase tracking-wide">
                Circuits
              </span>
              <Badge variant="secondary">
                {analysis().circuits.length}
              </Badge>
            </div>
            <p class="text-xs text-muted-foreground mb-2">
              Minimal dependent edge sets in the 2D rigidity matroid
            </p>
            <div class="space-y-1">
              <For each={analysis().circuits.slice(0, 5)}>
                {(circuit) => (
                  <div class="text-xs font-mono bg-muted/50 px-2 py-1 rounded">
                    {"{" + circuit.join(", ") + "}"}
                  </div>
                )}
              </For>
              <Show when={analysis().circuits.length > 5}>
                <div class="text-xs text-muted-foreground">
                  +{analysis().circuits.length - 5} more circuits
                </div>
              </Show>
            </div>
          </div>
        </Show>

        {/* Explanation */}
        <div class="text-xs text-muted-foreground border-t pt-3">
          {analysis().explanation}
        </div>
      </CardContent>
    </Card>
  );
}
