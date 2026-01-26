import { Accessor, createMemo, createSignal, createEffect, Show, For } from "solid-js";
import { Title } from "@solidjs/meta";
import {
  createAdjacencyMatrix,
  createIncidenceMatrix,
  createRigidityMatrix,
  computeMatrixRank,
  computeTrivialDOF,
  computeInternalDOF,
} from "./matrixUtils";
import { analyzeDimensionFolding, getDimensionDisplayString, DimensionAnalysis } from "./dimensionFolding";
import { analyzeConfigSpace, ConfigSpaceAnalysis } from "./threeUtils";
import MatrixTable from "./MatrixTable";
import ThreeJSGraph from "./ThreeJSGraph";
import { GRAPH_REGISTRY, FrameworkGraph, GraphInfo } from "./graphUtils";
import GraphSelector from "./GraphSelector";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Badge } from "~/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 450;

function CoordinateMatrix(props: {
  coordinates: Accessor<{ [key: string]: [number, number, number] }>;
}) {
  const cm = createMemo(() =>
    Object.entries(props.coordinates()).reduce(
      ({ matrix, labels }, [node, coords]) => ({
        matrix: [...matrix, coords],
        labels: [...labels, node],
      }),
      { matrix: [] as [number, number, number][], labels: [] as string[] }
    )
  );

  return (
    <MatrixTable
      title="Coordinate Matrix"
      rowLabels={cm().labels}
      colLabels={(cm().matrix?.[0] ?? []).map((_, i) => `D${i + 1}`)}
      matrix={cm().matrix}
      rounding={2}
    />
  );
}

interface RigidityAnalysis {
  matrix: number[][];
  rowLabels: string[];
  colLabels: string[];
  rank: number;
  expectedRank: number;
  trivialDOF: number;
  internalDOF: number;
  isRigid: boolean;
  vertices: number;
  edges: number;
  dimension: number;
}

/**
 * Configuration Space panel - explains the mathematical structure
 */
function ConfigSpacePanel(props: {
  graph: Accessor<FrameworkGraph>;
}) {
  const analysis = createMemo<ConfigSpaceAnalysis>(() => {
    return analyzeConfigSpace(props.graph());
  });

  return (
    <div class="space-y-6">
      {/* Overview */}
      <div>
        <h4 class="font-medium mb-2">Configuration Space Structure</h4>
        <pre class="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap font-mono">
          {analysis().structureDescription}
        </pre>
      </div>

      {/* DOF Summary */}
      <div class="grid grid-cols-3 gap-4">
        <div class="rounded-lg border p-3">
          <div class="text-xs text-muted-foreground uppercase tracking-wide">Total DOF</div>
          <div class="text-2xl font-bold">{analysis().totalDOF}</div>
          <div class="text-xs text-muted-foreground">
            3 × {props.graph().order} vertices
          </div>
        </div>
        <div class="rounded-lg border p-3">
          <div class="text-xs text-muted-foreground uppercase tracking-wide">Trivial DOF</div>
          <div class="text-2xl font-bold">{analysis().trivialDOF}</div>
          <div class="text-xs text-muted-foreground">
            rigid motions
          </div>
        </div>
        <div class="rounded-lg border p-3">
          <div class="text-xs text-muted-foreground uppercase tracking-wide">Internal DOF</div>
          <div class="text-2xl font-bold">{analysis().internalDOF}</div>
          <div class="text-xs text-muted-foreground">
            flex modes
          </div>
        </div>
      </div>

      {/* Per-node analysis */}
      <div>
        <h4 class="font-medium mb-2">Per-Node Configuration Space</h4>
        <div class="space-y-2">
          <For each={analysis().nodeAnalysis}>
            {(node) => (
              <div class="rounded-lg border p-3">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-medium">{node.nodeLabel}</span>
                  <Badge variant="outline" class="text-xs">
                    degree {node.degree}
                  </Badge>
                  <Badge 
                    variant={node.dimension === 1 ? "default" : "secondary"} 
                    class="text-xs"
                  >
                    {node.dimension === 0 ? "point" : 
                     node.dimension === 1 ? "circle S¹" : 
                     node.dimension === 2 ? "sphere S²" : "ℝ³"}
                  </Badge>
                </div>
                <p class="text-sm text-muted-foreground">{node.constraintDescription}</p>
                <p class="text-sm font-mono mt-1">{node.configSpaceDescription}</p>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Special Points explanation */}
      <div>
        <h4 class="font-medium mb-2">Special Points (Dimension Folding)</h4>
        <pre class="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap font-mono">
          {analysis().specialPointsDescription}
        </pre>
      </div>

      {/* Visualization key */}
      <div>
        <h4 class="font-medium mb-2">Visualization Key</h4>
        <div class="space-y-2 text-sm">
          <div class="flex items-center gap-3">
            <div class="w-4 h-4 rounded-full bg-blue-400/30 border border-blue-400"></div>
            <span>Blue wireframe spheres: distance constraints</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-4 h-1 bg-cyan-400 rounded"></div>
            <span>Cyan circles: configuration space (intersection of constraint spheres)</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-4 h-1 bg-green-400 rounded"></div>
            <span>Green circles: other sphere intersections</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-4 h-1 bg-orange-500 rounded"></div>
            <span>Orange arcs: folding motion paths on constraint spheres</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Red points: triple constraint intersections</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RigidityPanel(props: {
  graph: Accessor<FrameworkGraph>;
  coordinates: Accessor<{ [key: string]: [number, number, number] }>;
  dimension?: 2 | 3;
}) {
  const dimension = props.dimension ?? 3;

  const analysis = createMemo<RigidityAnalysis | null>(() => {
    const coords = props.coordinates();
    const graph = props.graph();
    // Check that we have coordinates for ALL vertices
    // Note: coords uses labels (v₁, v₂) not node IDs (1, 2)
    const coordKeys = Object.keys(coords);
    if (coordKeys.length !== graph.order || coordKeys.length === 0) return null;

    const { matrix, rowLabels, colLabels } = createRigidityMatrix(
      graph,
      coords,
      dimension
    );

    const rank = computeMatrixRank(matrix);
    const vertices = graph.order;
    const edges = graph.size;
    const trivialDOF = computeTrivialDOF(dimension);
    const expectedRank = dimension * vertices - trivialDOF;
    const internalDOF = computeInternalDOF(rank, vertices, dimension);
    const isRigid = internalDOF === 0;

    return {
      matrix,
      rowLabels,
      colLabels,
      rank,
      expectedRank,
      trivialDOF,
      internalDOF,
      isRigid,
      vertices,
      edges,
      dimension,
    };
  });

  return (
    <div class="space-y-4">
      <Show when={analysis()} fallback={
        <p class="text-sm text-muted-foreground">
          Waiting for coordinate data...
        </p>
      }>
        {(data) => (
          <>
            {/* Rigidity Status */}
            <div class="flex flex-wrap items-center gap-3">
              <Badge variant={data().isRigid ? "default" : "secondary"}>
                {data().isRigid ? "Rigid" : "Flexible"}
              </Badge>
              <span class="text-sm text-muted-foreground">
                in ℝ<sup>{data().dimension}</sup>
              </span>
            </div>

            {/* Statistics */}
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div class="rounded-lg border p-3">
                <div class="text-xs text-muted-foreground uppercase tracking-wide">Rank</div>
                <div class="text-2xl font-bold">{data().rank}</div>
                <div class="text-xs text-muted-foreground">
                  of {data().expectedRank} expected
                </div>
              </div>
              <div class="rounded-lg border p-3">
                <div class="text-xs text-muted-foreground uppercase tracking-wide">Internal DOF</div>
                <div class="text-2xl font-bold">{data().internalDOF}</div>
                <div class="text-xs text-muted-foreground">
                  flex modes
                </div>
              </div>
              <div class="rounded-lg border p-3">
                <div class="text-xs text-muted-foreground uppercase tracking-wide">Trivial DOF</div>
                <div class="text-2xl font-bold">{data().trivialDOF}</div>
                <div class="text-xs text-muted-foreground">
                  rigid motions
                </div>
              </div>
              <div class="rounded-lg border p-3">
                <div class="text-xs text-muted-foreground uppercase tracking-wide">Matrix Size</div>
                <div class="text-2xl font-bold">{data().edges}×{data().dimension * data().vertices}</div>
                <div class="text-xs text-muted-foreground">
                  edges × d·vertices
                </div>
              </div>
            </div>

            {/* Rigidity Matrix */}
            <div class="overflow-x-auto">
              <MatrixTable
                title="Rigidity Matrix R"
                rowLabels={data().rowLabels}
                colLabels={data().colLabels}
                matrix={data().matrix}
                rounding={3}
              />
            </div>

            <p class="text-sm text-muted-foreground">
              The rigidity matrix R is the Jacobian of edge length constraints.
              Its null space contains infinitesimal motions preserving edge lengths.
              {data().isRigid
                ? " This framework is rigid—only trivial motions (translations/rotations) exist."
                : ` This framework has ${data().internalDOF} internal degree(s) of freedom.`}
            </p>
          </>
        )}
      </Show>
    </div>
  );
}

/**
 * Render 2D graph layout on canvas.
 */
function render2DGraph(
  canvas: HTMLCanvasElement,
  graph: FrameworkGraph,
  width: number,
  height: number
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Clear canvas with background
  ctx.fillStyle = "#fafafa";
  ctx.fillRect(0, 0, width, height);

  // Render edges
  graph.forEachEdge((_edge, attr, source, target) => {
    const sourceAttr = graph.getNodeAttributes(source);
    const targetAttr = graph.getNodeAttributes(target);
    ctx.strokeStyle = attr.color;
    ctx.lineWidth = attr.size || 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(sourceAttr.x * width, sourceAttr.y * height);
    ctx.lineTo(targetAttr.x * width, targetAttr.y * height);
    ctx.stroke();
  });

  // Render nodes and labels
  graph.forEachNode((_node, attr) => {
    // Draw node shadow
    ctx.beginPath();
    ctx.arc(attr.x * width + 2, attr.y * height + 2, attr.size, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.fill();

    // Draw node
    ctx.beginPath();
    ctx.arc(attr.x * width, attr.y * height, attr.size, 0, 2 * Math.PI);
    ctx.fillStyle = attr.color;
    ctx.fill();

    // Render labels with coordinates
    const coordinatesText = `(${attr.coordinates.join(", ")})`;
    ctx.fillStyle = "#374151";
    ctx.font = "500 12px Inter, sans-serif";
    ctx.fillText(attr.label, attr.x * width + attr.size + 8, attr.y * height - 4);
    ctx.font = "400 11px monospace";
    ctx.fillStyle = "#6b7280";
    ctx.fillText(coordinatesText, attr.x * width + attr.size + 8, attr.y * height + 10);
  });
}

export default function GraphPage() {
  // Default graph
  const defaultGraphEntry = GRAPH_REGISTRY[0]; // V-Graph
  
  // Reactive state
  const [graph, setGraph] = createSignal<FrameworkGraph>(defaultGraphEntry.create());
  const [graphInfo, setGraphInfo] = createSignal<GraphInfo>(defaultGraphEntry.info);
  const [canvas, setCanvas] = createSignal<HTMLCanvasElement | undefined>(undefined);
  const [coordinates, setCoordinates] = createSignal<{
    [key: string]: [number, number, number];
  }>({});
  const [graphKey, setGraphKey] = createSignal(1); // Force re-mount of ThreeJSGraph (starts at 1 to be truthy)

  // Derived values
  const vertexCount = createMemo(() => graph().order);
  const edgeCount = createMemo(() => graph().size);

  // Adjacency matrix (reactive)
  const adjacencyData = createMemo(() => createAdjacencyMatrix(graph()));

  // Incidence matrix (reactive)
  const incidenceData = createMemo(() => createIncidenceMatrix(graph()));

  // Helper to check if all graph vertices have coordinates
  // Note: Graph node IDs are "1", "2", etc. but coordinates use labels like "v₁", "v₂"
  const hasAllCoordinates = (g: FrameworkGraph, coords: { [key: string]: [number, number, number] }) => {
    const coordKeys = Object.keys(coords);
    // Check that we have the same number of coordinates as vertices
    if (coordKeys.length !== g.order) return false;
    if (coordKeys.length === 0) return false;
    return true;
  };

  // Rigidity analysis (reactive based on coordinates)
  const rigidityInfo = createMemo(() => {
    const coords = coordinates();
    const g = graph();
    // Only compute when we have coordinates for ALL vertices in the current graph
    if (!hasAllCoordinates(g, coords)) return null;

    const { matrix } = createRigidityMatrix(g, coords, 3);
    const rank = computeMatrixRank(matrix);
    const trivialDOF = computeTrivialDOF(3);
    const expectedRank = 3 * g.order - trivialDOF;
    const internalDOF = computeInternalDOF(rank, g.order, 3);
    const isRigid = internalDOF === 0;

    return { rank, expectedRank, internalDOF, isRigid };
  });

  // Dimension folding analysis (reactive based on coordinates)
  const dimensionInfo = createMemo<DimensionAnalysis | null>(() => {
    const coords = coordinates();
    const g = graph();
    // Only compute when we have coordinates for ALL vertices in the current graph
    if (!hasAllCoordinates(g, coords)) return null;

    return analyzeDimensionFolding(g, coords);
  });

  // Render 2D canvas when graph or canvas changes
  createEffect(() => {
    const c = canvas();
    const g = graph();
    if (c) {
      render2DGraph(c, g, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  });

  // Handle graph selection
  const handleGraphChange = (newGraph: FrameworkGraph, info: GraphInfo) => {
    setGraph(newGraph);
    setGraphInfo(info);
    setCoordinates({}); // Reset coordinates
    setGraphKey((k) => k + 1); // Force ThreeJSGraph remount
  };

  return (
    <main class="container py-6">
      <Title>Graph Exploration | Dimension Folding</Title>

      {/* Page header */}
      <div class="mb-6">
        <div class="flex flex-wrap items-center gap-3 mb-2">
          <h1 class="text-2xl font-bold tracking-tight">Graph Exploration</h1>
          <GraphSelector
            currentGraphId={graphInfo().id}
            onGraphChange={handleGraphChange}
          />
          <Badge variant="outline">{vertexCount()}V, {edgeCount()}E</Badge>
          <Show when={rigidityInfo()}>
            {(info) => (
              <>
                <Badge variant={info().isRigid ? "default" : "secondary"}>
                  {info().isRigid ? "Rigid" : "Flexible"}
                </Badge>
                <Show when={!info().isRigid}>
                  <Badge variant="outline">
                    {info().internalDOF} DOF
                  </Badge>
                </Show>
              </>
            )}
          </Show>
          <Show when={dimensionInfo()}>
            {(dimInfo) => (
              <Tooltip>
                <TooltipTrigger>
                  <Badge 
                    variant={dimInfo().canFold ? "secondary" : "outline"}
                    class={dimInfo().canFold ? "cursor-help" : "cursor-help"}
                  >
                    {dimInfo().canFold 
                      ? `${dimInfo().currentDimension}D → ${dimInfo().minimalDimension}D`
                      : `${dimInfo().currentDimension}D`
                    }
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p class="max-w-xs text-sm">{dimInfo().explanation}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </Show>
        </div>
        <p class="text-muted-foreground">
          Visualize graphs as mechanical linkages in 3D space. Explore constraints
          and transformations to understand the relationship between graph structure and rigid motion.
        </p>
      </div>

      {/* Main visualization grid */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 2D Graph view */}
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-base">2D Graph Layout</CardTitle>
            <CardDescription>
              Abstract graph representation with node coordinates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <canvas
              ref={setCanvas}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              class="w-full rounded-md border bg-muted/30"
            />
          </CardContent>
        </Card>

        {/* 3D Linkage view - key forces remount on graph change */}
        <Show when={graphKey()} keyed>
          {(_key) => (
            <ThreeJSGraph
              graph={graph()}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              setCoordinates={setCoordinates}
            />
          )}
        </Show>
      </div>

      {/* Matrix views with tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Graph Matrices</CardTitle>
          <CardDescription>
            Different matrix representations capturing the graph's combinatorial structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="adjacency">
            <TabsList class="mb-4">
              <TabsTrigger value="adjacency">Adjacency</TabsTrigger>
              <TabsTrigger value="incidence">Incidence</TabsTrigger>
              <TabsTrigger value="coordinates">Coordinates</TabsTrigger>
              <TabsTrigger value="rigidity">Rigidity</TabsTrigger>
              <TabsTrigger value="configspace">Config Space</TabsTrigger>
            </TabsList>
            <TabsContent value="adjacency">
              <div class="max-w-md">
                <MatrixTable
                  title="Adjacency Matrix"
                  rowLabels={adjacencyData().labels}
                  colLabels={adjacencyData().labels}
                  matrix={adjacencyData().matrix}
                />
              </div>
              <p class="mt-3 text-sm text-muted-foreground">
                The adjacency matrix A has A[i,j] = 1 if vertices i and j are connected by an edge.
              </p>
            </TabsContent>
            <TabsContent value="incidence">
              <div class="max-w-md">
                <MatrixTable
                  title="Incidence Matrix"
                  rowLabels={incidenceData().rowLabels}
                  colLabels={incidenceData().colLabels}
                  matrix={incidenceData().matrix}
                />
              </div>
              <p class="mt-3 text-sm text-muted-foreground">
                The incidence matrix has rows for vertices and columns for edges, with 1s indicating incidence.
              </p>
            </TabsContent>
            <TabsContent value="coordinates">
              <div class="max-w-md">
                <CoordinateMatrix coordinates={coordinates} />
              </div>
              <p class="mt-3 text-sm text-muted-foreground">
                The coordinate matrix shows each vertex's position in 3D space (x, y, z).
              </p>
            </TabsContent>
            <TabsContent value="rigidity">
              <RigidityPanel graph={graph} coordinates={coordinates} dimension={3} />
            </TabsContent>
            <TabsContent value="configspace">
              <ConfigSpacePanel graph={graph} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}
