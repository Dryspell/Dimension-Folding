// ContractionBoard.tsx - Visual board for the dimension contraction game
import { Accessor, For, Show, createMemo } from "solid-js";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { Cell, getDimensionName, getCliqueName } from "./contractionGame";

interface ContractionBoardProps {
  cells: Accessor<Cell[]>;
  selectedCellIds: Accessor<string[]>;
  onCellClick: (cellId: string) => void;
  canContractSelected: Accessor<boolean>;
}

/**
 * Visual board showing cells as boxes that can be selected and contracted.
 */
export default function ContractionBoard(props: ContractionBoardProps) {
  // Sort cells by dimension (higher first) then by vertex count
  const sortedCells = createMemo(() => {
    return [...props.cells()].sort((a, b) => {
      if (b.dimension !== a.dimension) return b.dimension - a.dimension;
      return b.vertices.length - a.vertices.length;
    });
  });

  const isSelected = (cellId: string) => props.selectedCellIds().includes(cellId);

  const getDimensionColor = (dim: number): string => {
    switch (dim) {
      case 0: return "bg-slate-100 border-slate-300";
      case 1: return "bg-blue-50 border-blue-300";
      case 2: return "bg-green-50 border-green-300";
      case 3: return "bg-purple-50 border-purple-300";
      case 4: return "bg-orange-50 border-orange-300";
      default: return "bg-red-50 border-red-300";
    }
  };

  const getSelectedStyle = (cellId: string): string => {
    if (!isSelected(cellId)) return "";
    return props.canContractSelected() 
      ? "ring-2 ring-green-500 ring-offset-2" 
      : "ring-2 ring-yellow-500 ring-offset-2";
  };

  return (
    <div class="space-y-4">
      {/* Dimension groups */}
      <div class="flex flex-wrap gap-3 justify-center min-h-[120px] p-4 bg-muted/30 rounded-lg border-2 border-dashed">
        <Show when={sortedCells().length > 0} fallback={
          <div class="text-muted-foreground text-sm">No cells</div>
        }>
          <For each={sortedCells()}>
            {(cell) => (
              <Tooltip>
                <TooltipTrigger>
                  <button
                    onClick={() => props.onCellClick(cell.id)}
                    class={`
                      relative p-3 rounded-lg border-2 transition-all cursor-pointer
                      hover:scale-105 hover:shadow-md
                      ${getDimensionColor(cell.dimension)}
                      ${getSelectedStyle(cell.id)}
                    `}
                    style={{ "min-width": `${Math.max(80, cell.vertices.length * 35)}px` }}
                  >
                    {/* Dimension badge */}
                    <div class="absolute -top-2 -right-2">
                      <Badge 
                        variant={cell.dimension > 0 ? "default" : "secondary"}
                        class="text-xs"
                      >
                        {cell.dimension}D
                      </Badge>
                    </div>

                    {/* Vertices */}
                    <div class="flex flex-wrap gap-1 justify-center">
                      <For each={cell.vertices}>
                        {(vertex) => (
                          <span 
                            class="inline-block px-1.5 py-0.5 text-xs font-mono rounded"
                            style={{ "background-color": `${cell.color}20`, color: cell.color }}
                          >
                            {vertex}
                          </span>
                        )}
                      </For>
                    </div>

                    {/* Clique indicator */}
                    <Show when={cell.dimension > 0}>
                      <div class="text-xs text-muted-foreground mt-1 text-center">
                        {getCliqueName(cell.dimension)}
                      </div>
                    </Show>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <div class="text-sm">
                    <p class="font-medium">{getDimensionName(cell.dimension)}</p>
                    <p class="text-muted-foreground">
                      Vertices: {cell.vertices.join(", ")}
                    </p>
                    <p class="text-xs text-muted-foreground mt-1">
                      Click to select for contraction
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </For>
        </Show>
      </div>

      {/* Selection indicator */}
      <Show when={props.selectedCellIds().length > 0}>
        <div class="flex items-center justify-center gap-2 text-sm">
          <span class="text-muted-foreground">Selected:</span>
          <For each={props.selectedCellIds()}>
            {(id, index) => {
              const cell = props.cells().find(c => c.id === id);
              return (
                <>
                  <Show when={index() > 0}>
                    <span class="text-muted-foreground">+</span>
                  </Show>
                  <Badge variant="outline">
                    {cell ? `{${cell.vertices.join(", ")}}` : id}
                  </Badge>
                </>
              );
            }}
          </For>
          <Show when={props.canContractSelected()}>
            <span class="text-green-600 font-medium">→ Valid contraction</span>
          </Show>
          <Show when={!props.canContractSelected() && props.selectedCellIds().length >= 2}>
            <span class="text-yellow-600 font-medium">→ Missing edges</span>
          </Show>
        </div>
      </Show>
    </div>
  );
}
