/**
 * ConstructionBoard - Visual UI for the construction game
 * 
 * Two operations:
 * 1. Suspension - Add a new vertex connected to selected existing vertices
 * 2. Split Vertex - Replace a vertex with an edge (both endpoints inherit connections)
 */
import { Accessor, For, Show, createSignal, createMemo } from "solid-js";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { 
  ConstructionState, 
  addVertex, 
  splitVertex,
  undoStep,
  resetConstruction,
} from "./constructionGame";
import Graph from "graphology";

interface ConstructionBoardProps {
  state: Accessor<ConstructionState>;
  setState: (state: ConstructionState) => void;
  targetGraph: Accessor<Graph>;
}

// Predefined colors for vertices
const VERTEX_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#22c55e", // green
  "#a855f7", // purple
  "#f97316", // orange
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#eab308", // yellow
];

/**
 * Interactive 2D graph visualization using SVG
 */
function GraphVisualization(props: {
  vertices: { id: string; label: string; color: string }[];
  edges: { source: string; target: string }[];
  selectedIds: string[];
  hoveredId?: string;
  onVertexClick?: (id: string) => void;
  onVertexHover?: (id: string | null) => void;
  title: string;
  subtitle?: string;
  highlightColor?: string;
  interactive?: boolean;
  showNextVertex?: { id: string; label: string; color: string } | null;
}) {
  const width = 220;
  const height = 180;
  const padding = 35;
  
  // Compute positions in a circle layout
  const positions = createMemo(() => {
    // Include the "next vertex" placeholder in layout if provided
    const allVertices = props.showNextVertex 
      ? [...props.vertices, props.showNextVertex]
      : props.vertices;
    
    const n = allVertices.length;
    if (n === 0) return new Map<string, { x: number; y: number }>();
    
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - padding;
    
    const pos = new Map<string, { x: number; y: number }>();
    allVertices.forEach((v, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      pos.set(v.id, {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      });
    });
    return pos;
  });
  
  const isSelected = (id: string) => props.selectedIds.includes(id);
  const isHovered = (id: string) => props.hoveredId === id;
  
  return (
    <div class={`border-2 rounded-lg p-3 transition-colors ${
      props.interactive ? "border-green-300 bg-green-50/50" : "border-gray-200 bg-gray-50"
    }`}>
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm font-semibold">{props.title}</p>
        <Show when={props.subtitle}>
          <Badge variant="outline" class="text-xs">{props.subtitle}</Badge>
        </Show>
      </div>
      <svg width={width} height={height} class="mx-auto">
        {/* Edges */}
        <For each={props.edges}>
          {(edge) => {
            const p1 = positions().get(edge.source);
            const p2 = positions().get(edge.target);
            if (!p1 || !p2) return null;
            
            // Highlight edges connected to selected/hovered vertices
            const isHighlighted = isSelected(edge.source) || isSelected(edge.target) ||
                                  isHovered(edge.source) || isHovered(edge.target);
            return (
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={isHighlighted ? "#22c55e" : "#94a3b8"}
                stroke-width={isHighlighted ? 3 : 2}
                class="transition-all duration-150"
              />
            );
          }}
        </For>
        
        {/* Potential edges from next vertex to selected */}
        <Show when={props.showNextVertex}>
          <For each={props.selectedIds}>
            {(selectedId) => {
              const p1 = positions().get(props.showNextVertex!.id);
              const p2 = positions().get(selectedId);
              if (!p1 || !p2) return null;
              return (
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="#22c55e"
                  stroke-width="2"
                  stroke-dasharray="4,4"
                  opacity="0.7"
                />
              );
            }}
          </For>
        </Show>
        
        {/* Vertices */}
        <For each={props.vertices}>
          {(vertex) => {
            const pos = positions().get(vertex.id);
            if (!pos) return null;
            const selected = isSelected(vertex.id);
            const hovered = isHovered(vertex.id);
            const highlighted = selected || hovered;
            
            return (
              <g 
                class={props.onVertexClick ? "cursor-pointer" : ""}
                onClick={() => props.onVertexClick?.(vertex.id)}
                onMouseEnter={() => props.onVertexHover?.(vertex.id)}
                onMouseLeave={() => props.onVertexHover?.(null)}
              >
                {/* Glow effect for selected */}
                <Show when={selected}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={22}
                    fill="none"
                    stroke={props.highlightColor ?? "#22c55e"}
                    stroke-width="3"
                    opacity="0.5"
                  />
                </Show>
                
                {/* Main circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={highlighted ? 18 : 14}
                  fill={vertex.color}
                  stroke={highlighted ? (props.highlightColor ?? "#22c55e") : "#fff"}
                  stroke-width={highlighted ? 3 : 2}
                  class="transition-all duration-150"
                />
                
                {/* Label */}
                <text
                  x={pos.x}
                  y={pos.y}
                  text-anchor="middle"
                  dominant-baseline="central"
                  fill="white"
                  font-size={highlighted ? "12" : "10"}
                  font-weight="bold"
                  class="pointer-events-none"
                >
                  {vertex.label.replace("Node ", "")}
                </text>
              </g>
            );
          }}
        </For>
        
        {/* Next vertex placeholder (ghosted) */}
        <Show when={props.showNextVertex}>
          {(nextVertex) => {
            const pos = positions().get(nextVertex().id);
            if (!pos) return null;
            return (
              <g>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={14}
                  fill="#e5e7eb"
                  stroke="#9ca3af"
                  stroke-width="2"
                  stroke-dasharray="4,4"
                />
                <text
                  x={pos.x}
                  y={pos.y}
                  text-anchor="middle"
                  dominant-baseline="central"
                  fill="#6b7280"
                  font-size="10"
                  font-weight="bold"
                >
                  {nextVertex().label.replace("Node ", "")}
                </text>
                <text
                  x={pos.x}
                  y={pos.y + 24}
                  text-anchor="middle"
                  fill="#22c55e"
                  font-size="8"
                  font-weight="bold"
                >
                  NEXT
                </text>
              </g>
            );
          }}
        </Show>
        
        {/* Empty state */}
        <Show when={props.vertices.length === 0 && !props.showNextVertex}>
          <text
            x={width / 2}
            y={height / 2}
            text-anchor="middle"
            fill="#9ca3af"
            font-size="12"
          >
            Click "Add Vertex" to start
          </text>
        </Show>
      </svg>
      
      {/* Interactive hint */}
      <Show when={props.interactive && props.vertices.length > 0}>
        <p class="text-xs text-center text-green-600 mt-1">
          Click vertices to select connections
        </p>
      </Show>
    </div>
  );
}

export default function ConstructionBoard(props: ConstructionBoardProps) {
  const [mode, setMode] = createSignal<"suspension" | "split">("suspension");
  // Use array instead of Set for reactivity
  const [selectedVertexIds, setSelectedVertexIds] = createSignal<string[]>([]);
  const [selectedForSplit, setSelectedForSplit] = createSignal<string | null>(null);
  const [hoveredVertex, setHoveredVertex] = createSignal<string | null>(null);
  
  // Get target graph info
  const targetVertices = createMemo(() => {
    const vertices: { id: string; label: string; color: string }[] = [];
    let colorIndex = 0;
    props.targetGraph().forEachNode((id, attrs) => {
      vertices.push({ 
        id, 
        label: (attrs.label as string) || id,
        color: (attrs.color as string) || VERTEX_COLORS[colorIndex % VERTEX_COLORS.length],
      });
      colorIndex++;
    });
    return vertices;
  });
  
  const targetEdges = createMemo(() => {
    const edges: { source: string; target: string }[] = [];
    props.targetGraph().forEachEdge((edge, attrs, source, target) => {
      edges.push({ source, target });
    });
    return edges;
  });
  
  // Current construction vertices/edges
  const constructionVertices = createMemo(() => 
    props.state().vertices.map(v => ({ id: v.id, label: v.label, color: v.color }))
  );
  
  const constructionEdges = createMemo(() => 
    props.state().edges.map(e => ({ source: e.source, target: e.target }))
  );
  
  // Progress tracking
  const progress = createMemo(() => ({
    vertices: props.state().vertices.length,
    targetVertices: targetVertices().length,
    edges: props.state().edges.length,
    targetEdges: targetEdges().length,
  }));
  
  // Next vertex to add (from target graph that's not yet added)
  const nextVertexToAdd = createMemo(() => {
    const addedIds = new Set(props.state().vertices.map(v => v.id));
    for (const tv of targetVertices()) {
      if (!addedIds.has(tv.id)) {
        return tv;
      }
    }
    return null;
  });
  
  // Get connections for the next vertex (which existing vertices it should connect to)
  const getTargetConnections = (vertexId: string): string[] => {
    const addedIds = new Set(props.state().vertices.map(v => v.id));
    const connections: string[] = [];
    
    targetEdges().forEach(e => {
      if (e.source === vertexId && addedIds.has(e.target)) {
        connections.push(e.target);
      }
      if (e.target === vertexId && addedIds.has(e.source)) {
        connections.push(e.source);
      }
    });
    
    return connections;
  };
  
  // Toggle vertex selection for suspension
  const toggleVertexSelection = (id: string) => {
    if (mode() !== "suspension") return;
    
    setSelectedVertexIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(vid => vid !== id);
      } else {
        return [...prev, id];
      }
    });
  };
  
  // Handle suspension
  const handleSuspension = () => {
    const next = nextVertexToAdd();
    if (!next) return;
    
    const connectsTo = selectedVertexIds();
    const colorIndex = props.state().vertices.length % VERTEX_COLORS.length;
    
    const newState = addVertex(
      props.state(),
      next.id,
      next.label,
      VERTEX_COLORS[colorIndex],
      connectsTo
    );
    props.setState(newState);
    setSelectedVertexIds([]);
  };
  
  // Auto-select correct connections based on target graph
  const autoSelectConnections = () => {
    const next = nextVertexToAdd();
    if (!next) return;
    
    const connections = getTargetConnections(next.id);
    setSelectedVertexIds(connections);
  };
  
  // Handle split vertex selection
  const handleSplitSelection = (id: string) => {
    if (mode() !== "split") return;
    setSelectedForSplit(prev => prev === id ? null : id);
  };
  
  // Handle split vertex
  const handleSplitVertex = () => {
    const vertexToSplit = selectedForSplit();
    if (!vertexToSplit) return;
    
    const original = props.state().vertices.find(v => v.id === vertexToSplit);
    if (!original) return;
    
    const newId1 = `${vertexToSplit}_a`;
    const newId2 = `${vertexToSplit}_b`;
    const colorIndex = props.state().vertices.length % VERTEX_COLORS.length;
    
    const newState = splitVertex(
      props.state(),
      vertexToSplit,
      newId1,
      newId2,
      `${original.label}a`,
      `${original.label}b`,
      original.color,
      VERTEX_COLORS[(colorIndex + 1) % VERTEX_COLORS.length]
    );
    props.setState(newState);
    setSelectedForSplit(null);
  };
  
  // Handle undo
  const handleUndo = () => {
    const newState = undoStep(props.state());
    props.setState(newState);
    setSelectedVertexIds([]);
    setSelectedForSplit(null);
  };
  
  // Handle reset
  const handleReset = () => {
    const newState = resetConstruction(props.state());
    props.setState(newState);
    setSelectedVertexIds([]);
    setSelectedForSplit(null);
  };
  
  // Check if construction matches target
  const isComplete = createMemo(() => {
    if (progress().vertices !== progress().targetVertices) return false;
    if (progress().edges !== progress().targetEdges) return false;
    return true;
  });
  
  return (
    <div class="space-y-4">
      {/* Header with dimension, progress, and controls */}
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-purple-700">
              d = {props.state().currentDimension}
            </div>
            <div class="text-xs text-muted-foreground">dimension</div>
          </div>
          <Separator orientation="vertical" class="h-10" />
          <div class="flex gap-3">
            <div class="text-center">
              <div class="text-lg font-semibold">
                {progress().vertices}/{progress().targetVertices}
              </div>
              <div class="text-xs text-muted-foreground">vertices</div>
            </div>
            <div class="text-center">
              <div class="text-lg font-semibold">
                {progress().edges}/{progress().targetEdges}
              </div>
              <div class="text-xs text-muted-foreground">edges</div>
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleUndo} 
            disabled={props.state().steps.length === 0}
          >
            Undo
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>
      
      {/* Status message */}
      <div class={`p-2 rounded text-sm ${
        props.state().message.includes("increased") 
          ? "bg-purple-100 text-purple-800"
          : "bg-gray-100 text-gray-700"
      }`}>
        {props.state().message}
      </div>
      
      {/* Graph visualizations side by side */}
      <div class="grid grid-cols-2 gap-4">
        <GraphVisualization
          vertices={constructionVertices()}
          edges={constructionEdges()}
          selectedIds={mode() === "suspension" ? selectedVertexIds() : 
                       mode() === "split" && selectedForSplit() ? [selectedForSplit()!] : []}
          hoveredId={hoveredVertex() ?? undefined}
          onVertexClick={mode() === "suspension" ? toggleVertexSelection : handleSplitSelection}
          onVertexHover={setHoveredVertex}
          title="Building"
          subtitle={`${constructionVertices().length} vertices`}
          highlightColor={mode() === "suspension" ? "#22c55e" : "#ef4444"}
          interactive={mode() === "suspension" && constructionVertices().length > 0}
          showNextVertex={mode() === "suspension" ? nextVertexToAdd() : null}
        />
        <GraphVisualization
          vertices={targetVertices()}
          edges={targetEdges()}
          selectedIds={[]}
          title="Target"
          subtitle={`${targetVertices().length}v, ${targetEdges().length}e`}
        />
      </div>
      
      <Separator />
      
      {/* Operation mode selection */}
      <div class="flex gap-2">
        <Button
          variant={mode() === "suspension" ? "default" : "outline"}
          onClick={() => { setMode("suspension"); setSelectedForSplit(null); }}
          class={mode() === "suspension" ? "bg-green-600 hover:bg-green-700 flex-1" : "flex-1"}
        >
          <span class="mr-2">+</span> Suspension
        </Button>
        <Button
          variant={mode() === "split" ? "default" : "outline"}
          onClick={() => { setMode("split"); setSelectedVertexIds([]); }}
          class={mode() === "split" ? "bg-orange-600 hover:bg-orange-700 flex-1" : "flex-1"}
          disabled={props.state().vertices.length === 0}
        >
          <span class="mr-2">÷</span> Split Vertex
        </Button>
      </div>
      
      {/* Suspension mode panel */}
      <Show when={mode() === "suspension"}>
        <Card class="border-green-300 bg-green-50/30">
          <CardHeader class="pb-2">
            <div class="flex items-center justify-between">
              <CardTitle class="text-base text-green-800">Add New Vertex</CardTitle>
              <Show when={nextVertexToAdd()}>
                <Badge class="bg-green-600">{nextVertexToAdd()!.label}</Badge>
              </Show>
            </div>
            <CardDescription>
              Select which existing vertices to connect to. More connections = higher dimension.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <Show when={nextVertexToAdd()} fallback={
              <div class="p-3 bg-green-100 rounded text-green-800 text-center">
                <p class="font-medium">All vertices added!</p>
                <p class="text-sm">{isComplete() ? "Graph construction complete!" : "Check edges."}</p>
              </div>
            }>
              {/* Selected connections display */}
              <div class="space-y-2">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-sm font-medium">Connections:</span>
                  <Show when={selectedVertexIds().length > 0} fallback={
                    <span class="text-sm text-muted-foreground italic">
                      None selected (will add isolated vertex)
                    </span>
                  }>
                    <For each={selectedVertexIds()}>
                      {(id) => {
                        const vertex = props.state().vertices.find(v => v.id === id);
                        return (
                          <Badge 
                            variant="secondary" 
                            class="cursor-pointer hover:bg-red-100"
                            onClick={() => toggleVertexSelection(id)}
                          >
                            {vertex?.label ?? id}
                            <span class="ml-1 text-red-500">×</span>
                          </Badge>
                        );
                      }}
                    </For>
                  </Show>
                </div>
                
                {/* Dimension impact */}
                <div class="flex items-center gap-2 p-2 bg-purple-100 rounded">
                  <span class="text-sm">
                    <strong>{selectedVertexIds().length}</strong> connection{selectedVertexIds().length !== 1 ? "s" : ""} 
                  </span>
                  <span class="text-purple-700">→</span>
                  <span class="text-sm font-medium text-purple-700">
                    d ≤ {Math.max(selectedVertexIds().length, props.state().currentDimension)}
                  </span>
                  <Show when={selectedVertexIds().length > props.state().currentDimension}>
                    <Badge class="bg-purple-600 text-xs">+{selectedVertexIds().length - props.state().currentDimension} dim</Badge>
                  </Show>
                </div>
              </div>
              
              {/* Action buttons */}
              <div class="flex gap-2">
                <Button
                  variant="outline"
                  onClick={autoSelectConnections}
                  class="flex-1"
                  disabled={constructionVertices().length === 0}
                >
                  Auto-select from target
                </Button>
                <Button
                  onClick={handleSuspension}
                  class="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Add Vertex
                </Button>
              </div>
            </Show>
          </CardContent>
        </Card>
      </Show>
      
      {/* Split mode panel */}
      <Show when={mode() === "split"}>
        <Card class="border-orange-300 bg-orange-50/30">
          <CardHeader class="pb-2">
            <CardTitle class="text-base text-orange-800">Split a Vertex</CardTitle>
            <CardDescription>
              Replace a vertex with an edge. Both endpoints inherit all original connections.
              This always adds +1 to dimension.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <Show when={selectedForSplit()} fallback={
              <p class="text-sm text-muted-foreground">
                Click a vertex in the "Building" graph to select it for splitting.
              </p>
            }>
              <div class="flex items-center gap-3 p-2 bg-orange-100 rounded">
                <span class="text-sm">Splitting:</span>
                <Badge class="bg-orange-600">
                  {props.state().vertices.find(v => v.id === selectedForSplit())?.label}
                </Badge>
                <span class="text-orange-700">→</span>
                <span class="text-sm font-medium text-orange-700">
                  d = {props.state().currentDimension + 1}
                </span>
                <Badge class="bg-purple-600 text-xs">+1 dim</Badge>
              </div>
              <Button
                onClick={handleSplitVertex}
                class="w-full bg-orange-600 hover:bg-orange-700"
              >
                Split into Edge
              </Button>
            </Show>
          </CardContent>
        </Card>
      </Show>
      
      <Separator />
      
      {/* Construction history */}
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm">Construction History</CardTitle>
        </CardHeader>
        <CardContent>
          <Show when={props.state().steps.length > 0} fallback={
            <p class="text-sm text-muted-foreground text-center py-2">
              Start by adding your first vertex with Suspension!
            </p>
          }>
            <div class="space-y-1.5 max-h-36 overflow-y-auto">
              <For each={props.state().steps}>
                {(step, index) => {
                  const prevDim = index() > 0 ? props.state().steps[index() - 1].currentDimension : 0;
                  const dimIncreased = step.currentDimension > prevDim;
                  return (
                    <div class={`flex items-center gap-2 text-sm p-1.5 rounded ${
                      dimIncreased ? "bg-purple-100" : "bg-gray-50"
                    }`}>
                      <Badge 
                        variant={dimIncreased ? "default" : "outline"}
                        class={dimIncreased ? "bg-purple-600 min-w-[45px] justify-center" : "min-w-[45px] justify-center"}
                      >
                        d={step.currentDimension}
                      </Badge>
                      <span class={step.type === "split_vertex" ? "text-orange-700" : "text-gray-700"}>
                        {step.description}
                      </span>
                      <Show when={step.connectsTo && step.connectsTo.length > 0}>
                        <Badge variant="outline" class="text-xs">
                          {step.connectsTo!.length} conn
                        </Badge>
                      </Show>
                    </div>
                  );
                }}
              </For>
            </div>
          </Show>
        </CardContent>
      </Card>
      
      {/* Completion celebration */}
      <Show when={isComplete()}>
        <div class="p-6 bg-gradient-to-r from-green-100 to-purple-100 border-2 border-green-300 rounded-lg text-center">
          <p class="text-2xl font-bold text-green-700 mb-1">
            🎉 Construction Complete!
          </p>
          <p class="text-lg text-purple-700">
            Minimum dimension achieved: <strong>d = {props.state().currentDimension}</strong>
          </p>
          <p class="text-sm text-muted-foreground mt-2">
            Try resetting and finding a different construction sequence!
          </p>
        </div>
      </Show>
    </div>
  );
}
