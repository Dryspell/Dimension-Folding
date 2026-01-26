// CoordinateMatrix.tsx - Visual coordinate + edge vector matrices for dimension reduction game
import { Accessor, For, Show, createMemo } from "solid-js";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { ReductionState, getActiveColumns } from "./dimensionReduction";

interface CoordinateMatrixProps {
  state: Accessor<ReductionState>;
}

/**
 * Visual display of both the coordinate matrix and edge vector matrix.
 */
export default function CoordinateMatrix(props: CoordinateMatrixProps) {
  const activeColumns = createMemo(() => getActiveColumns(props.state()));
  
  const formatNumber = (n: number): string => {
    if (Math.abs(n) < 1e-10) return "0";
    if (Number.isInteger(n)) return String(n);
    if (Math.abs(n) < 0.01) return n.toExponential(1);
    return n.toFixed(2);
  };

  const getCellClass = (value: number, colIndex: number): string => {
    const isActive = activeColumns().includes(colIndex);
    const isNonZero = Math.abs(value) > 1e-10;
    
    if (isNonZero) {
      return value > 0 
        ? "bg-green-100 text-green-800 font-bold" 
        : "bg-red-100 text-red-800 font-bold";
    }
    return isActive ? "bg-gray-50" : "bg-gray-100 text-gray-400";
  };

  const getEdgeCellClass = (value: number): string => {
    const isNonZero = Math.abs(value) > 1e-10;
    if (isNonZero) {
      return value > 0 
        ? "bg-blue-100 text-blue-800 font-bold" 
        : "bg-orange-100 text-orange-800 font-bold";
    }
    return "bg-gray-50";
  };

  return (
    <div class="space-y-6">
      {/* Two-column layout for matrices */}
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Coordinate Matrix */}
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <h4 class="font-medium text-sm">Coordinate Matrix</h4>
            <Badge variant="default">Rank: {props.state().currentRank}</Badge>
          </div>
          <div class="overflow-x-auto">
            <table class="border-collapse text-sm font-mono">
              <thead>
                <tr>
                  <th class="p-2 text-left text-muted-foreground text-xs">Vertex</th>
                  <For each={Array.from({ length: props.state().numDimensions }, (_, i) => i)}>
                    {(colIndex) => {
                      const isActive = activeColumns().includes(colIndex);
                      return (
                        <th 
                          class={`p-1.5 text-center min-w-[40px] text-xs ${
                            isActive ? "text-foreground" : "text-muted-foreground/50"
                          }`}
                        >
                          D{colIndex + 1}
                        </th>
                      );
                    }}
                  </For>
                </tr>
              </thead>
              <tbody>
                <For each={props.state().vertices}>
                  {(vertex, vertexIdx) => (
                    <tr>
                      <td class="p-1.5 font-medium">
                        <span 
                          class="inline-block px-1.5 py-0.5 rounded text-white text-xs"
                          style={{ "background-color": vertex.color }}
                        >
                          {vertex.label}
                        </span>
                      </td>
                      <For each={vertex.coords}>
                        {(value, colIndex) => (
                          <td 
                            class={`p-1.5 text-center border text-xs ${getCellClass(value, colIndex())}`}
                          >
                            {formatNumber(value)}
                          </td>
                        )}
                      </For>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </div>

        {/* Edge Vector Matrix */}
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <h4 class="font-medium text-sm">Edge Vector Matrix</h4>
            <Badge variant="default" class="bg-purple-600">
              d_min = {props.state().edgeVectorRank}
            </Badge>
          </div>
          <Show when={props.state().edgeVectors.length > 0} fallback={
            <p class="text-sm text-muted-foreground">No edges</p>
          }>
            <div class="overflow-x-auto">
              <table class="border-collapse text-sm font-mono">
                <thead>
                  <tr>
                    <th class="p-2 text-left text-muted-foreground text-xs">Edge</th>
                    <For each={Array.from({ length: props.state().numDimensions }, (_, i) => i)}>
                      {(colIndex) => (
                        <th class="p-1.5 text-center min-w-[40px] text-xs text-muted-foreground">
                          D{colIndex + 1}
                        </th>
                      )}
                    </For>
                    <th class="p-1.5 text-center text-xs text-muted-foreground">|e|</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={props.state().edgeVectors}>
                    {(edge) => (
                      <tr>
                        <td class="p-1.5 font-medium text-xs">
                          <span class="text-muted-foreground">{edge.sourceLabel}</span>
                          <span class="mx-1">→</span>
                          <span>{edge.targetLabel}</span>
                        </td>
                        <For each={edge.vector}>
                          {(value) => (
                            <td class={`p-1.5 text-center border text-xs ${getEdgeCellClass(value)}`}>
                              {formatNumber(value)}
                            </td>
                          )}
                        </For>
                        <td class="p-1.5 text-center text-xs text-muted-foreground border">
                          {edge.length.toFixed(2)}
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </Show>
        </div>
      </div>

      <Separator />

      {/* Key insight: Edge Rank = Minimal Dimension */}
      <div class="p-3 bg-purple-50 border border-purple-200 rounded-lg space-y-2">
        <div class="flex items-center gap-3">
          <span class="text-lg font-bold text-purple-700">
            Minimal Dimension (d_min) = {props.state().edgeVectorRank}
          </span>
        </div>
        <p class="text-xs text-purple-600">
          The edge vector rank equals the <strong>affine dimension</strong> of the vertex positions.
          This is the true minimal embedding dimension of the linkage.
        </p>
        <p class="text-xs text-muted-foreground">
          <em>Note:</em> Coordinate rank is {props.state().currentRank} because we placed 
          v₁ at (1,0,0) instead of (0,0,0). The edge vectors measure differences, 
          giving the true dimension.
        </p>
      </div>

      {/* Summary stats */}
      <div class="flex flex-wrap items-center gap-4 text-sm">
        <div class="flex items-center gap-2">
          <span class="text-muted-foreground">Coord Rank:</span>
          <Badge variant="outline">{props.state().currentRank}</Badge>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-muted-foreground">d_min:</span>
          <Badge variant="default" class="bg-purple-600">{props.state().edgeVectorRank}</Badge>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-muted-foreground">Vertices:</span>
          <span>{props.state().vertices.length}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-muted-foreground">Edges:</span>
          <span>{props.state().edges.length}</span>
        </div>
      </div>

      {/* Legend */}
      <div class="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span class="font-medium">Coordinates:</span>
        <div class="flex items-center gap-1">
          <div class="w-3 h-3 bg-green-100 border rounded"></div>
          <span>+</span>
        </div>
        <div class="flex items-center gap-1">
          <div class="w-3 h-3 bg-red-100 border rounded"></div>
          <span>−</span>
        </div>
        <span class="mx-2">|</span>
        <span class="font-medium">Edge vectors:</span>
        <div class="flex items-center gap-1">
          <div class="w-3 h-3 bg-blue-100 border rounded"></div>
          <span>+</span>
        </div>
        <div class="flex items-center gap-1">
          <div class="w-3 h-3 bg-orange-100 border rounded"></div>
          <span>−</span>
        </div>
      </div>
    </div>
  );
}
