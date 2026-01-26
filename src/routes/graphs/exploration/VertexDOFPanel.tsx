// VertexDOFPanel.tsx - Per-vertex DOF analysis connecting construction and folding insights
import { Accessor, createMemo, Show, For } from "solid-js";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { FrameworkGraph } from "./graphUtils";

interface VertexDOFPanelProps {
  graph: Accessor<FrameworkGraph>;
  currentDimension: Accessor<number>;
}

interface VertexAnalysis {
  id: string;
  label: string;
  degree: number;
  /** From construction: dimension required when this vertex was added */
  dimensionRequired: number;
  /** From folding: DOF in current dimension */
  currentDOF: number;
  /** Is this vertex flexible in the current embedding? */
  isFlexible: boolean;
  /** Color for display */
  color: string;
}

interface SystemAnalysis {
  vertices: VertexAnalysis[];
  /** Total DOF of the system */
  totalDOF: number;
  /** Is the system flexible? */
  isFlexible: boolean;
  /** d_min from construction perspective */
  d_min: number;
  /** Can fold from current dimension? */
  canFold: boolean;
  /** Explanation text */
  explanation: string;
}

/**
 * Analyze each vertex from both construction and folding perspectives.
 */
function analyzeVertexDOF(graph: FrameworkGraph, currentDimension: number): SystemAnalysis {
  const vertices: VertexAnalysis[] = [];
  
  // Count degrees for each vertex
  const degreeMap = new Map<string, number>();
  graph.forEachNode((nodeId) => {
    degreeMap.set(nodeId, graph.degree(nodeId));
  });
  
  // Analyze each vertex
  graph.forEachNode((nodeId, attrs) => {
    const degree = degreeMap.get(nodeId) ?? 0;
    const label = attrs.label || nodeId;
    
    // Construction perspective: vertex needs dimension equal to its degree
    // (when added generically with degree connections)
    const dimensionRequired = degree;
    
    // Folding perspective: DOF = currentDimension - degree (clamped to 0)
    const currentDOF = Math.max(0, currentDimension - degree);
    
    vertices.push({
      id: nodeId,
      label,
      degree,
      dimensionRequired,
      currentDOF,
      isFlexible: currentDOF > 0,
      color: attrs.color || "#888",
    });
  });
  
  // Sort by degree (highest first)
  vertices.sort((a, b) => b.degree - a.degree);
  
  // System-level analysis
  const totalDOF = vertices.reduce((sum, v) => sum + v.currentDOF, 0);
  const isFlexible = totalDOF > 0;
  
  // d_min is determined by the maximum degree in the graph
  // (the most constrained vertex sets the minimum dimension)
  const d_min = Math.max(1, ...vertices.map(v => v.dimensionRequired));
  
  const canFold = currentDimension > d_min;
  
  let explanation: string;
  if (isFlexible) {
    const flexCount = vertices.filter(v => v.isFlexible).length;
    explanation = `${flexCount} vertex(es) have degrees of freedom. ` +
      `The graph can potentially fold from ${currentDimension}D to ${d_min}D.`;
  } else {
    explanation = `All vertices are fully constrained. ` +
      `The graph is rigid in ${currentDimension}D.`;
  }
  
  return {
    vertices,
    totalDOF,
    isFlexible,
    d_min,
    canFold,
    explanation,
  };
}

/**
 * Panel showing per-vertex DOF analysis from both construction and folding perspectives.
 * 
 * Key insight: The same vertex property viewed two ways:
 * - Construction: "Vertex with degree k requires dimension k"
 * - Folding: "Vertex with degree k has DOF = d - k"
 */
export default function VertexDOFPanel(props: VertexDOFPanelProps) {
  const analysis = createMemo(() => 
    analyzeVertexDOF(props.graph(), props.currentDimension())
  );
  
  return (
    <Card class="h-fit">
      <CardHeader class="pb-3">
        <CardTitle class="text-base flex items-center gap-2">
          Vertex Analysis
          <Tooltip>
            <TooltipTrigger>
              <Badge variant={analysis().isFlexible ? "secondary" : "default"} class="cursor-help">
                {analysis().isFlexible ? "Flexible" : "Rigid"}
              </Badge>
            </TooltipTrigger>
            <TooltipContent class="max-w-xs">
              <p class="text-sm">{analysis().explanation}</p>
            </TooltipContent>
          </Tooltip>
        </CardTitle>
        <CardDescription class="text-xs">
          Dual perspectives: construction (↑) and folding (↓)
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        {/* Summary stats */}
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="rounded-lg border p-2">
            <div class="text-xs text-muted-foreground">d_min</div>
            <div class="text-lg font-bold">{analysis().d_min}</div>
          </div>
          <div class="rounded-lg border p-2">
            <div class="text-xs text-muted-foreground">Current</div>
            <div class="text-lg font-bold">{props.currentDimension()}</div>
          </div>
          <div class="rounded-lg border p-2">
            <div class="text-xs text-muted-foreground">Total DOF</div>
            <div class={`text-lg font-bold ${analysis().isFlexible ? "text-green-600" : "text-muted-foreground"}`}>
              {analysis().totalDOF}
            </div>
          </div>
        </div>
        
        {/* Can fold indicator */}
        <Show when={analysis().canFold}>
          <div class="rounded-lg bg-green-50 border border-green-200 p-2 text-center">
            <span class="text-sm text-green-700">
              Can fold: {props.currentDimension()}D → {analysis().d_min}D
            </span>
          </div>
        </Show>
        
        <Separator />
        
        {/* Per-vertex analysis */}
        <div class="space-y-2">
          <div class="grid grid-cols-[1fr_auto_auto] gap-2 text-xs text-muted-foreground px-1">
            <span>Vertex</span>
            <span class="text-center">Degree</span>
            <span class="text-center">DOF</span>
          </div>
          
          <For each={analysis().vertices}>
            {(vertex) => (
              <div 
                class={`grid grid-cols-[1fr_auto_auto] gap-2 items-center p-2 rounded-lg border ${
                  vertex.isFlexible ? "bg-green-50 border-green-200" : "bg-muted/30"
                }`}
              >
                <div class="flex items-center gap-2">
                  <div 
                    class="w-3 h-3 rounded-full" 
                    style={{ "background-color": vertex.color }}
                  />
                  <span class="font-medium text-sm">{vertex.label}</span>
                </div>
                
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" class="cursor-help">
                      {vertex.degree}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p class="text-xs">
                      {vertex.degree} edge{vertex.degree !== 1 ? "s" : ""} connected
                      <br />
                      <span class="text-muted-foreground">
                        → Requires dim ≥ {vertex.dimensionRequired}
                      </span>
                    </p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger>
                    <Badge 
                      variant={vertex.isFlexible ? "default" : "secondary"}
                      class={`cursor-help ${vertex.isFlexible ? "bg-green-600" : ""}`}
                    >
                      {vertex.currentDOF}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p class="text-xs">
                      DOF = {props.currentDimension()} - {vertex.degree} = {vertex.currentDOF}
                      <br />
                      <span class="text-muted-foreground">
                        {vertex.isFlexible 
                          ? "Can move while preserving edges" 
                          : "Fully constrained"}
                      </span>
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </For>
        </div>
        
        {/* Explanation */}
        <div class="text-xs text-muted-foreground border-t pt-3">
          <p class="mb-2">
            <strong>Construction view:</strong> Each vertex with degree k requires 
            at least dimension k for generic positioning.
          </p>
          <p>
            <strong>Folding view:</strong> In dimension d, each vertex with degree k 
            has DOF = d - k. Vertices with DOF &gt; 0 can move.
          </p>
        </div>
        
        {/* Link to games */}
        <div class="text-xs text-center pt-2">
          <a 
            href="/graphs/contraction" 
            class="text-blue-600 hover:underline"
          >
            Explore in Dimension Games →
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
