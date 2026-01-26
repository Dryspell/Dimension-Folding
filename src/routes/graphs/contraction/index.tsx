// Contraction Game Page - Interactive dimension discovery through vertex contraction
import { createSignal, createMemo, Show, For } from "solid-js";
import { Title } from "@solidjs/meta";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { GRAPH_REGISTRY, FrameworkGraph, GraphInfo } from "../exploration/graphUtils";
import GraphSelector from "../exploration/GraphSelector";
import ContractionBoard from "./ContractionBoard";
import CoordinateMatrix from "./CoordinateMatrix";
import GraphPreview from "./GraphPreview";
import {
  GameState,
  initializeGame,
  performContraction,
  undoContraction,
  resetGame,
  getValidMoves,
  isClique,
  getDimensionName,
  autoSolve,
} from "./contractionGame";
import {
  ReductionState,
  initializeReduction,
  performOperation,
  undoOperation,
  resetReduction,
  getPossibleOperations,
  autoReduce,
  RowOperation,
  FoldingOperation,
  getFoldingOperations,
  performFolding,
  findMaximalCliques,
  findHinges,
  RigidClique,
  Hinge,
  getDimensionReducingMotions,
  DimensionReducingMotion,
} from "./dimensionReduction";
import {
  ConstructionState,
  initializeConstruction,
} from "./constructionGame";
import ConstructionBoard from "./ConstructionBoard";

export default function ContractionGamePage() {
  // Graph selection
  const defaultGraphEntry = GRAPH_REGISTRY[0];
  const [graph, setGraph] = createSignal<FrameworkGraph>(defaultGraphEntry.create());
  const [graphInfo, setGraphInfo] = createSignal<GraphInfo>(defaultGraphEntry.info);

  // Clique contraction game state
  const [gameState, setGameState] = createSignal<GameState>(initializeGame(graph()));
  const [selectedCellIds, setSelectedCellIds] = createSignal<string[]>([]);

  // Coordinate reduction game state
  const [reductionState, setReductionState] = createSignal<ReductionState>(initializeReduction(graph()));
  const [selectedOperation, setSelectedOperation] = createSignal<RowOperation | null>(null);
  const [selectedFolding, setSelectedFolding] = createSignal<FoldingOperation | null>(null);
  
  // Construction game state
  const [constructionState, setConstructionState] = createSignal<ConstructionState>(
    initializeConstruction(graph())
  );

  // Reset all games when graph changes
  const handleGraphChange = (newGraph: FrameworkGraph, info: GraphInfo) => {
    setGraph(newGraph);
    setGraphInfo(info);
    setGameState(initializeGame(newGraph));
    setSelectedCellIds([]);
    setReductionState(initializeReduction(newGraph));
    setSelectedOperation(null);
    setSelectedFolding(null);
    setConstructionState(initializeConstruction(newGraph));
  };
  
  // Get available folding operations
  const foldingOperations = createMemo(() => {
    return getFoldingOperations(reductionState());
  });
  
  // Get dimension-reducing motions based on DOF analysis
  const dimensionMotions = createMemo(() => {
    return getDimensionReducingMotions(reductionState());
  });
  
  // Get rigid substructures (cliques) and hinges
  const rigidCliques = createMemo(() => findMaximalCliques(reductionState()));
  const hinges = createMemo(() => findHinges(rigidCliques(), reductionState().edges));

  // Check if selected cells can be contracted
  const canContractSelected = createMemo(() => {
    const ids = selectedCellIds();
    if (ids.length < 2) return false;

    const cells = gameState().cells.filter(c => ids.includes(c.id));
    const allVertices = cells.flatMap(c => c.vertices);
    return isClique(graph(), allVertices);
  });

  // Get valid moves for display
  const validMoves = createMemo(() => {
    return getValidMoves(graph(), gameState()).filter(m => m.isValid);
  });

  // Handle cell click - toggle selection
  const handleCellClick = (cellId: string) => {
    setSelectedCellIds(prev => {
      if (prev.includes(cellId)) {
        return prev.filter(id => id !== cellId);
      } else {
        return [...prev, cellId];
      }
    });
  };

  // Perform contraction of selected cells
  const handleContract = () => {
    const ids = selectedCellIds();
    if (ids.length < 2) return;

    const newState = performContraction(graph(), gameState(), ids);
    setGameState(newState);
    setSelectedCellIds([]);
  };

  // Undo last move
  const handleUndo = () => {
    setGameState(prev => undoContraction(prev));
    setSelectedCellIds([]);
  };

  // Reset game
  const handleReset = () => {
    setGameState(initializeGame(graph()));
    setSelectedCellIds([]);
  };

  // Auto-solve to show maximum dimension
  const handleAutoSolve = () => {
    const result = autoSolve(graph());
    // Replay the steps
    let state = initializeGame(graph());
    for (const step of result.steps) {
      const cellIds = state.cells
        .filter(c => step.contracted.some(v => c.vertices.includes(v)))
        .map(c => c.id);
      state = performContraction(graph(), state, cellIds);
    }
    setGameState(state);
    setSelectedCellIds([]);
  };

  // === Coordinate Reduction Game Handlers ===

  // Get possible operations for the reduction game
  const possibleOperations = createMemo(() => {
    return getPossibleOperations(reductionState());
  });

  // Operations that reduce rank
  const reducingOperations = createMemo(() => {
    const currentRank = reductionState().currentRank;
    return possibleOperations().filter(op => op.resultingRank < currentRank);
  });

  // Perform selected operation
  const handlePerformOperation = () => {
    const op = selectedOperation();
    if (!op) return;
    setReductionState(prev => performOperation(prev, op));
    setSelectedOperation(null);
  };

  // Undo last reduction operation
  const handleUndoReduction = () => {
    setReductionState(prev => undoOperation(prev));
    setSelectedOperation(null);
  };

  // Reset reduction game
  const handleResetReduction = () => {
    setReductionState(initializeReduction(graph()));
    setSelectedOperation(null);
    setSelectedFolding(null);
  };
  
  // Perform folding operation
  const handlePerformFolding = () => {
    const op = selectedFolding();
    if (!op) return;
    setReductionState(prev => performFolding(prev, op));
    setSelectedFolding(null);
  };

  // Auto-reduce to minimum rank
  const handleAutoReduce = () => {
    const result = autoReduce(graph());
    // Replay the steps
    let state = initializeReduction(graph());
    for (const step of result.steps) {
      const ops = getPossibleOperations(state);
      // Parse step description to find matching op
      const matchingOp = ops.find(op => step.startsWith(op.description));
      if (matchingOp) {
        state = performOperation(state, matchingOp);
      }
    }
    setReductionState(state);
    setSelectedOperation(null);
  };

  return (
    <main class="container py-6">
      <Title>Dimension Games | Dimension Folding</Title>

      {/* Header */}
      <div class="mb-6">
        <div class="flex flex-wrap items-center gap-4 mb-3">
          <h1 class="text-3xl font-bold tracking-tight">Dimension Games</h1>
          <div class="flex items-center gap-2">
            <GraphSelector
              currentGraphId={graphInfo().id}
              onGraphChange={handleGraphChange}
            />
            <Badge variant="secondary" class="text-sm">
              {graph().order} vertices, {graph().size} edges
            </Badge>
          </div>
        </div>
        <p class="text-muted-foreground max-w-2xl">
          Explore the minimal embedding dimension (d_min) of graphs through interactive games.
          Each game offers a different perspective on why certain graphs require specific dimensions.
        </p>
      </div>

      <Tabs defaultValue="construction" class="w-full">
        <TabsList class="mb-4">
          <TabsTrigger value="construction">Construction (Build Up)</TabsTrigger>
          <TabsTrigger value="reduction">Reduction (Fold Down)</TabsTrigger>
          <TabsTrigger value="contraction">Clique Contraction</TabsTrigger>
        </TabsList>

        {/* =========== CONSTRUCTION TAB =========== */}
        <TabsContent value="construction">
          <div class="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
            {/* Main construction area */}
            <Card>
              <CardHeader class="pb-4">
                <CardTitle class="flex items-center gap-2">
                  <span>Construction Game</span>
                  <Badge variant="outline">{graphInfo().name}</Badge>
                </CardTitle>
                <CardDescription>
                  Build the target graph step by step. Each operation affects the minimum dimension.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConstructionBoard 
                  state={constructionState}
                  setState={setConstructionState}
                  targetGraph={graph}
                />
              </CardContent>
            </Card>
            
            {/* Sidebar with explanation */}
            <div class="space-y-4">
              {/* Quick reference */}
              <Card class="border-purple-200 bg-purple-50/50">
                <CardHeader class="pb-2">
                  <CardTitle class="text-base">How to Play</CardTitle>
                </CardHeader>
                <CardContent class="text-sm space-y-3">
                  <div class="space-y-2">
                    <div class="flex items-start gap-2">
                      <Badge class="bg-green-600 shrink-0">1</Badge>
                      <div>
                        <p class="font-medium">Suspension</p>
                        <p class="text-xs text-muted-foreground">
                          Add a vertex with k connections → dimension ≤ k
                        </p>
                      </div>
                    </div>
                    <div class="flex items-start gap-2">
                      <Badge class="bg-orange-600 shrink-0">2</Badge>
                      <div>
                        <p class="font-medium">Split Vertex</p>
                        <p class="text-xs text-muted-foreground">
                          Replace vertex with edge → +1 dimension
                        </p>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div class="p-2 bg-purple-100 rounded text-center">
                    <p class="text-xs text-purple-700">
                      <strong>Goal:</strong> Construct the target graph with minimum dimension!
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Examples */}
              <Card>
                <CardHeader class="pb-2">
                  <CardTitle class="text-base">Dimension Examples</CardTitle>
                </CardHeader>
                <CardContent class="text-xs space-y-2">
                  <div class="flex items-center justify-between">
                    <span>Path P₃</span>
                    <Badge variant="outline">d = 1</Badge>
                  </div>
                  <div class="flex items-center justify-between">
                    <span>Triangle K₃</span>
                    <Badge variant="outline">d = 2</Badge>
                  </div>
                  <div class="flex items-center justify-between">
                    <span>Tetrahedron K₄</span>
                    <Badge variant="outline">d = 3</Badge>
                  </div>
                  <div class="flex items-center justify-between">
                    <span>Octahedron K₂,₂,₂</span>
                    <Badge variant="outline">d = 4</Badge>
                  </div>
                </CardContent>
              </Card>
              
              {/* Tips */}
              <Card>
                <CardHeader class="pb-2">
                  <CardTitle class="text-base">Tips</CardTitle>
                </CardHeader>
                <CardContent class="text-xs text-muted-foreground space-y-1">
                  <p>• Click vertices in "Building" to select connections</p>
                  <p>• Use "Auto-select" to match the target graph</p>
                  <p>• Fewer connections = lower dimension</p>
                  <p>• Try different build orders for the same graph!</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* =========== COORDINATE REDUCTION TAB =========== */}
        <TabsContent value="reduction">
          <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            {/* Main matrix area */}
            <div class="space-y-6">
              <Card>
                <CardHeader>
                  <div class="flex items-center justify-between">
                    <div>
                      <CardTitle>Coordinate Matrix</CardTitle>
                      <CardDescription>
                        Each vertex starts in an independent dimension. 
                        Apply folding operations to reduce d_min (edge vector rank = minimal embedding dimension).
                      </CardDescription>
                    </div>
                    <div class="flex items-center gap-2">
                      <Badge variant="default" class="text-lg px-3 py-1 bg-purple-600">
                        d_min = {reductionState().edgeVectorRank}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CoordinateMatrix state={reductionState} />

                  {/* Controls */}
                  <div class="flex flex-wrap gap-2 mt-4 justify-center">
                    <Button
                      onClick={handlePerformOperation}
                      disabled={!selectedOperation()}
                      variant={selectedOperation() ? "default" : "secondary"}
                    >
                      Apply Operation
                    </Button>
                    <Button
                      onClick={handleUndoReduction}
                      disabled={reductionState().history.length === 0}
                      variant="outline"
                    >
                      Undo
                    </Button>
                    <Button onClick={handleResetReduction} variant="outline">
                      Reset
                    </Button>
                    <Button onClick={handleAutoReduce} variant="secondary">
                      Auto-Reduce
                    </Button>
                  </div>

                  {/* Message */}
                  <div class="mt-4 text-center text-sm text-muted-foreground">
                    {reductionState().message}
                  </div>
                </CardContent>
              </Card>

              {/* Completion message */}
              <Show when={reductionState().isComplete}>
                <Card class="border-green-200 bg-green-50">
                  <CardContent class="pt-6">
                    <div class="text-center">
                      <h3 class="text-lg font-bold text-green-800 mb-2">
                        Minimum Rank Achieved!
                      </h3>
                      <p class="text-green-700">
                        The coordinate matrix has been reduced to rank{" "}
                        <strong>{reductionState().currentRank}</strong>.
                      </p>
                      <p class="text-sm text-green-600 mt-2">
                        This suggests d_min(G) = {reductionState().currentRank} for this graph.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Show>
            </div>

            {/* Sidebar: DOF Analysis and Operations */}
            <div class="space-y-4">
              {/* Graph preview */}
              <GraphPreview graph={graph} />

              {/* DOF Analysis - Key insight from construction game */}
              <Card class={reductionState().isFlexible ? "border-green-300 bg-green-50/30" : "border-red-300 bg-red-50/30"}>
                <CardHeader class="pb-2">
                  <CardTitle class="text-base flex items-center gap-2">
                    Degrees of Freedom
                    <Badge class={reductionState().isFlexible ? "bg-green-600" : "bg-red-600"}>
                      {reductionState().isFlexible ? "Flexible" : "Rigid"}
                    </Badge>
                  </CardTitle>
                  <CardDescription class="text-xs">
                    Vertices with DOF &gt; 0 can move while preserving edge lengths
                  </CardDescription>
                </CardHeader>
                <CardContent class="space-y-2">
                  <div class="grid grid-cols-2 gap-2 text-sm">
                    <For each={reductionState().vertexDOFs}>
                      {(vdof) => (
                        <div class={`flex items-center justify-between p-1.5 rounded text-xs ${
                          vdof.isFlexible ? "bg-green-100" : "bg-gray-100"
                        }`}>
                          <span class="font-medium">{vdof.label}</span>
                          <div class="flex items-center gap-1">
                            <span class="text-muted-foreground">deg={vdof.degree}</span>
                            <Badge 
                              variant={vdof.isFlexible ? "default" : "outline"}
                              class={vdof.isFlexible ? "bg-green-600 text-xs" : "text-xs"}
                            >
                              DOF={vdof.dof}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                  <Separator />
                  <div class="text-center text-sm">
                    <span class="text-muted-foreground">Total DOF: </span>
                    <span class={`font-bold ${reductionState().isFlexible ? "text-green-700" : "text-red-700"}`}>
                      {reductionState().totalDOF}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Dimension-Reducing Motions */}
              <Card class="border-purple-200">
                <CardHeader class="pb-2">
                  <CardTitle class="text-base">Possible Motions</CardTitle>
                  <CardDescription class="text-xs">
                    Moves that could reduce dimension
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Show when={dimensionMotions().length > 0} fallback={
                    <p class="text-xs text-muted-foreground">
                      {reductionState().isFlexible 
                        ? "No dimension-reducing motions found yet."
                        : "Graph is rigid - no motions available."}
                    </p>
                  }>
                    <div class="space-y-2">
                      <For each={dimensionMotions()}>
                        {(motion) => (
                          <div class="p-2 bg-purple-50 rounded border border-purple-200 text-xs">
                            <div class="font-medium">{motion.description}</div>
                            <div class="flex items-center gap-2 mt-1">
                              <Badge variant="outline" class="text-xs">
                                {motion.vertexLabel} (DOF={motion.dof})
                              </Badge>
                              <span class="text-purple-700">→</span>
                              <Badge class="bg-purple-600 text-xs">
                                d={motion.targetDimension}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>
                </CardContent>
              </Card>

              {/* Rigid Substructures */}
              <Card class="border-blue-200">
                <CardHeader class="pb-2">
                  <CardTitle class="text-base">Rigid Substructures</CardTitle>
                  <CardDescription class="text-xs">
                    Cliques (K_n) are rigid in (n-1) dimensions
                  </CardDescription>
                </CardHeader>
                <CardContent class="space-y-2">
                  <Show when={rigidCliques().length > 0} fallback={
                    <p class="text-xs text-muted-foreground">No triangles or larger cliques found</p>
                  }>
                    <div class="flex flex-wrap gap-1">
                      <For each={rigidCliques()}>
                        {(clique) => (
                          <Badge variant="outline" class="text-xs border-blue-300">
                            K_{clique.vertices.length} ({clique.vertices.join(",")}) = {clique.dimension}D
                          </Badge>
                        )}
                      </For>
                    </div>
                  </Show>
                  
                  <Show when={hinges().length > 0}>
                    <Separator class="my-2" />
                    <p class="text-xs font-medium text-muted-foreground">Hinges:</p>
                    <div class="flex flex-wrap gap-1">
                      <For each={hinges()}>
                        {(hinge) => (
                          <Badge variant="secondary" class="text-xs">
                            [{hinge.axisVertices.join("-")}]
                          </Badge>
                        )}
                      </For>
                    </div>
                  </Show>
                </CardContent>
              </Card>

              {/* Folding Operations - geometrically valid */}
              <Card class="border-green-200">
                <CardHeader class="pb-3">
                  <CardTitle class="text-base flex items-center gap-2">
                    Folding Operations
                    <Badge variant="default" class="bg-green-600 text-xs">Length-preserving</Badge>
                  </CardTitle>
                  <CardDescription>
                    Edge alignments (for trees) and hinge rotations (for clique pairs)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Show when={foldingOperations().length > 0} fallback={
                    <div class="text-sm space-y-2">
                      <p class="text-muted-foreground">
                        {reductionState().edgeVectorRank === 1 
                          ? "d_min = 1 achieved! (collinear)" 
                          : "No simple folding operations available."}
                      </p>
                      <Show when={reductionState().edgeVectorRank > 1}>
                        <p class="text-xs text-orange-600">
                          Current d_min upper bound: {reductionState().edgeVectorRank}.
                          The graph may be rigid at this dimension, or may require 
                          coordinated multi-vertex moves not captured by hinge folds.
                        </p>
                      </Show>
                    </div>
                  }>
                    <div class="space-y-2 max-h-48 overflow-y-auto">
                      <For each={foldingOperations()}>
                        {(op) => {
                          const isSelected = selectedFolding()?.description === op.description;
                          const isHinge = op.type === "hinge_fold";
                          return (
                            <button
                              onClick={() => setSelectedFolding(op)}
                              class={`w-full text-left p-2 rounded border transition-colors text-sm
                                ${isSelected ? "bg-green-600 text-white" : "hover:bg-green-50 border-green-200"}
                              `}
                            >
                              <div class="flex items-center gap-1 text-xs">
                                <Badge variant="outline" class={`text-xs ${isHinge ? "border-blue-400" : "border-gray-300"}`}>
                                  {isHinge ? "hinge" : "edge"}
                                </Badge>
                                <span class="font-medium">{op.description}</span>
                              </div>
                              <div class="flex gap-2 mt-1 text-xs">
                                <Badge variant="default" class="text-xs bg-purple-600">
                                  d_min → {op.resultingEdgeRank}
                                </Badge>
                              </div>
                            </button>
                          );
                        }}
                      </For>
                    </div>
                    <Button
                      onClick={handlePerformFolding}
                      disabled={!selectedFolding()}
                      variant="default"
                      class="w-full mt-3 bg-green-600 hover:bg-green-700"
                    >
                      Apply Folding
                    </Button>
                  </Show>
                </CardContent>
              </Card>

              {/* Row Operations (for exploration) */}
              <Card>
                <CardHeader class="pb-3">
                  <CardTitle class="text-base">Row Operations</CardTitle>
                  <CardDescription class="text-xs text-orange-600">
                    Note: These may not preserve edge lengths
                  </CardDescription>
                  <CardDescription>
                    Operations justified by edge relationships
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Show when={reducingOperations().length > 0}>
                    <div class="mb-3 p-2 bg-green-50 rounded border border-green-200 text-sm text-green-700">
                      {reducingOperations().length} operations reduce rank
                    </div>
                  </Show>
                  
                  <div class="space-y-2 max-h-64 overflow-y-auto">
                    <For each={possibleOperations().slice(0, 20)}>
                      {(op) => {
                        const isSelected = selectedOperation()?.description === op.description;
                        const reducesRank = op.resultingRank < reductionState().currentRank;
                        return (
                          <button
                            onClick={() => setSelectedOperation(op)}
                            class={`w-full text-left p-2 rounded border transition-colors text-sm
                              ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted/50"}
                              ${reducesRank && !isSelected ? "border-green-300 bg-green-50/50" : ""}
                            `}
                          >
                            <div class="flex items-center justify-between">
                              <span class="font-mono">{op.description}</span>
                              <Badge 
                                variant={reducesRank ? "default" : "outline"}
                                class={reducesRank ? "bg-green-600" : ""}
                              >
                                → {op.resultingRank}
                              </Badge>
                            </div>
                          </button>
                        );
                      }}
                    </For>
                    <Show when={possibleOperations().length > 20}>
                      <p class="text-xs text-muted-foreground">
                        +{possibleOperations().length - 20} more operations
                      </p>
                    </Show>
                  </div>
                </CardContent>
              </Card>

              {/* Edge list */}
              <Card>
                <CardHeader class="pb-3">
                  <CardTitle class="text-base">Edge Constraints</CardTitle>
                  <CardDescription>
                    Edges justify row operations between connected vertices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div class="flex flex-wrap gap-1">
                    <For each={reductionState().edges}>
                      {(edge) => (
                        <Badge variant="outline" class="text-xs font-mono">
                          {edge.sourceLabel}—{edge.targetLabel}
                        </Badge>
                      )}
                    </For>
                  </div>
                </CardContent>
              </Card>

              {/* Explanation */}
              <Card>
                <CardHeader class="pb-3">
                  <CardTitle class="text-base">How It Works</CardTitle>
                </CardHeader>
                <CardContent class="text-sm space-y-3">
                  <p class="text-muted-foreground">
                    Each vertex starts with a 1 in its own dimension (identity matrix).
                  </p>
                  <Separator />
                  <p class="text-muted-foreground">
                    <strong>Safe operations:</strong> Add or subtract rows of vertices 
                    that share an edge. The edge constraint justifies the combination.
                  </p>
                  <Separator />
                  <p class="text-muted-foreground">
                    <strong>Goal:</strong> Reduce the rank of the coordinate matrix. 
                    The minimum achievable rank is d_min(G).
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* =========== CLIQUE CONTRACTION TAB =========== */}
        <TabsContent value="contraction">
          <div class="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
            {/* Main game area */}
            <div class="space-y-6">
              {/* Game board */}
              <Card>
                <CardHeader>
                  <div class="flex items-center justify-between">
                    <div>
                      <CardTitle>Contraction Board</CardTitle>
                      <CardDescription>
                        Click cells to select, then contract if they form a clique
                      </CardDescription>
                    </div>
                    <div class="flex items-center gap-2">
                      <Badge variant="default" class="text-lg px-3 py-1">
                        Max: {gameState().maxDimension}D
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
              <ContractionBoard
                cells={() => gameState().cells}
                selectedCellIds={selectedCellIds}
                onCellClick={handleCellClick}
                canContractSelected={canContractSelected}
              />

              {/* Controls */}
              <div class="flex flex-wrap gap-2 mt-4 justify-center">
                <Button
                  onClick={handleContract}
                  disabled={!canContractSelected()}
                  variant={canContractSelected() ? "default" : "secondary"}
                >
                  Contract Selected
                </Button>
                <Button
                  onClick={handleUndo}
                  disabled={gameState().history.length === 0}
                  variant="outline"
                >
                  Undo
                </Button>
                <Button onClick={handleReset} variant="outline">
                  Reset
                </Button>
                <Button onClick={handleAutoSolve} variant="secondary">
                  Auto-Solve
                </Button>
              </div>

              {/* Message */}
              <div class="mt-4 text-center text-sm text-muted-foreground">
                {gameState().message}
              </div>
            </CardContent>
          </Card>

          {/* Game complete message */}
          <Show when={gameState().isComplete}>
            <Card class="border-green-200 bg-green-50">
              <CardContent class="pt-6">
                <div class="text-center">
                  <h3 class="text-lg font-bold text-green-800 mb-2">
                    Game Complete!
                  </h3>
                  <p class="text-green-700">
                    The maximum dimension achieved is{" "}
                    <strong>{getDimensionName(gameState().maxDimension)}</strong>.
                  </p>
                  <p class="text-sm text-green-600 mt-2">
                    This suggests d_min(G) ≥ {gameState().maxDimension} for this graph.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Show>

          {/* History */}
          <Show when={gameState().history.length > 0}>
            <Card>
              <CardHeader class="pb-3">
                <CardTitle class="text-base">Move History</CardTitle>
              </CardHeader>
              <CardContent>
                <div class="space-y-2">
                  <For each={gameState().history}>
                    {(cells, index) => (
                      <div class="text-xs text-muted-foreground">
                        Step {index() + 1}: {cells.length} cells →{" "}
                        {gameState().history[index() + 1]?.length ?? gameState().cells.length} cells
                      </div>
                    )}
                  </For>
                </div>
              </CardContent>
            </Card>
          </Show>
        </div>

        {/* Sidebar: Rules and valid moves */}
        <div class="space-y-6">
          {/* Graph preview */}
          <GraphPreview graph={graph} />

          {/* Current valid moves */}
          <Card>
            <CardHeader class="pb-3">
              <CardTitle class="text-base">Valid Contractions</CardTitle>
              <CardDescription>
                Cell pairs that can be contracted (form a clique)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Show when={validMoves().length > 0} fallback={
                <p class="text-sm text-muted-foreground">
                  No valid contractions available.
                </p>
              }>
                <div class="space-y-2 max-h-48 overflow-y-auto">
                  <For each={validMoves().slice(0, 10)}>
                    {(move) => {
                      const cells = gameState().cells.filter(c => 
                        move.cellIds.includes(c.id)
                      );
                      const vertices = cells.flatMap(c => c.vertices);
                      return (
                        <button
                          onClick={() => setSelectedCellIds(move.cellIds)}
                          class="w-full text-left p-2 rounded border hover:bg-muted/50 transition-colors text-sm"
                        >
                          <div class="flex items-center justify-between">
                            <span class="font-mono">
                              {"{" + vertices.join(", ") + "}"}
                            </span>
                            <Badge variant="outline">→ {move.resultDimension}D</Badge>
                          </div>
                        </button>
                      );
                    }}
                  </For>
                  <Show when={validMoves().length > 10}>
                    <p class="text-xs text-muted-foreground">
                      +{validMoves().length - 10} more moves
                    </p>
                  </Show>
                </div>
              </Show>
            </CardContent>
          </Card>

          {/* Rules */}
          <Card>
            <CardHeader class="pb-3">
              <CardTitle class="text-base">Rules</CardTitle>
            </CardHeader>
            <CardContent class="text-sm space-y-3">
              <div>
                <p class="font-medium">Initial State</p>
                <p class="text-muted-foreground">
                  Each vertex starts as a 0D cell (point).
                </p>
              </div>
              <Separator />
              <div>
                <p class="font-medium">Contraction</p>
                <p class="text-muted-foreground">
                  Cells can merge if ALL their vertices form a complete subgraph (clique).
                </p>
              </div>
              <Separator />
              <div>
                <p class="font-medium">Dimension</p>
                <p class="text-muted-foreground">
                  A cell with n vertices has dimension n-1:
                </p>
                <ul class="text-muted-foreground text-xs mt-1 space-y-1">
                  <li>• 1 vertex → 0D (point)</li>
                  <li>• 2 vertices → 1D (edge, K₂)</li>
                  <li>• 3 vertices → 2D (triangle, K₃)</li>
                  <li>• 4 vertices → 3D (tetrahedron, K₄)</li>
                </ul>
              </div>
              <Separator />
              <div>
                <p class="font-medium">Goal</p>
                <p class="text-muted-foreground">
                  Find the maximum dimension achievable through contractions.
                  This gives a lower bound on d_min(G).
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Graph info */}
          <Card>
            <CardHeader class="pb-3">
              <CardTitle class="text-base">Graph: {graphInfo().name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-sm text-muted-foreground">
                {graphInfo().description}
              </p>
              <div class="mt-2 flex gap-2">
                <Badge variant="outline">{graph().order} vertices</Badge>
                <Badge variant="outline">{graph().size} edges</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
