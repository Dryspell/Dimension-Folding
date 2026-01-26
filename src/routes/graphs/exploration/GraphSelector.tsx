// GraphSelector.tsx - Component for selecting different graphs
import { For, createSignal, createEffect } from "solid-js";
import { GRAPH_REGISTRY, GraphInfo, FrameworkGraph } from "./graphUtils";
import { Badge } from "~/components/ui/badge";

interface GraphSelectorProps {
  currentGraphId: string;
  onGraphChange: (graph: FrameworkGraph, info: GraphInfo) => void;
}

/**
 * Dropdown selector for switching between different graph types.
 * Shows graph name, vertex/edge counts, and expected rigidity.
 */
export default function GraphSelector(props: GraphSelectorProps) {
  const [isOpen, setIsOpen] = createSignal(false);
  const [selectedId, setSelectedId] = createSignal(props.currentGraphId);

  // Sync with external prop changes
  createEffect(() => {
    setSelectedId(props.currentGraphId);
  });

  const currentGraph = () => GRAPH_REGISTRY.find((g) => g.info.id === selectedId());

  const handleSelect = (entry: (typeof GRAPH_REGISTRY)[0]) => {
    setSelectedId(entry.info.id);
    setIsOpen(false);
    const graph = entry.create();
    props.onGraphChange(graph, entry.info);
  };

  const categoryLabels: Record<GraphInfo["category"], string> = {
    complete: "Complete",
    bipartite: "Bipartite",
    cycle: "Cycles",
    path: "Paths",
    platonic: "Platonic",
    other: "Other",
  };

  // Group graphs by category
  const groupedGraphs = () => {
    const groups: Record<string, (typeof GRAPH_REGISTRY)[0][]> = {};
    for (const entry of GRAPH_REGISTRY) {
      const cat = entry.info.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(entry);
    }
    return groups;
  };

  return (
    <div class="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen())}
        class="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors min-w-[200px]"
      >
        <span class="flex-1 text-left">
          {currentGraph()?.info.name ?? "Select Graph"}
        </span>
        <svg
          class={`h-4 w-4 transition-transform ${isOpen() ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen() && (
        <>
          {/* Backdrop to close on click outside */}
          <div
            class="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div class="absolute left-0 top-full z-50 mt-1 w-80 rounded-lg border bg-card shadow-lg">
            <div class="max-h-96 overflow-y-auto p-2">
              <For each={Object.entries(groupedGraphs())}>
                {([category, entries]) => (
                  <div class="mb-2">
                    <div class="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {categoryLabels[category as GraphInfo["category"]]}
                    </div>
                    <For each={entries}>
                      {(entry) => (
                        <button
                          type="button"
                          onClick={() => handleSelect(entry)}
                          class={`w-full flex items-center gap-3 rounded-md px-2 py-2 text-left transition-colors ${
                            selectedId() === entry.info.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-accent"
                          }`}
                        >
                          <div class="flex-1 min-w-0">
                            <div class="font-medium text-sm truncate">
                              {entry.info.name}
                            </div>
                            <div class="text-xs opacity-70 truncate">
                              {entry.info.description}
                            </div>
                          </div>
                          <div class="flex items-center gap-1 flex-shrink-0">
                            <Badge
                              variant="outline"
                              class={`text-xs ${
                                selectedId() === entry.info.id
                                  ? "border-primary-foreground/30"
                                  : ""
                              }`}
                            >
                              {entry.info.vertices}V, {entry.info.edges}E
                            </Badge>
                            <Badge
                              variant={entry.info.expectedRigid ? "default" : "secondary"}
                              class="text-xs"
                            >
                              {entry.info.expectedRigid ? "Rigid" : "Flex"}
                            </Badge>
                          </div>
                        </button>
                      )}
                    </For>
                  </div>
                )}
              </For>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
