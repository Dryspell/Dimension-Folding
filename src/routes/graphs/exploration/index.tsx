import { Accessor, createMemo, createSignal, onMount } from "solid-js";
import { Title } from "@solidjs/meta";
import {
  createAdjacencyMatrix,
  createIncidenceMatrix,
} from "./matrixUtils";
import MatrixTable from "./MatrixTable";
import ThreeJSGraph from "./ThreeJSGraph";
import { createK3Graph, createVGraph } from "./graphUtils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Badge } from "~/components/ui/badge";

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

export default function GraphPage() {
  const [canvas, setCanvas] = createSignal<HTMLCanvasElement | undefined>(undefined);
  const graph = createVGraph();
  const { matrix: adjacencyMatrix, labels: adjacencyLabels } = createAdjacencyMatrix(graph);
  const {
    matrix: incidenceMatrix,
    rowLabels: incidenceRowLabels,
    colLabels: incidenceColLabels,
  } = createIncidenceMatrix(graph);
  const [coordinates, setCoordinates] = createSignal<{
    [key: string]: [number, number, number];
  }>({});

  onMount(() => {
    const canvasContext = canvas()?.getContext("2d");
    if (!canvasContext) {
      console.error("Failed to get 2d context from canvas");
      return;
    }

    // Clear canvas with background
    canvasContext.fillStyle = "#fafafa";
    canvasContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Render edges
    graph.forEachEdge((edge, attr, source, target) => {
      const sourceAttr = graph.getNodeAttributes(source);
      const targetAttr = graph.getNodeAttributes(target);
      canvasContext.strokeStyle = attr.color;
      canvasContext.lineWidth = attr.size || 2;
      canvasContext.lineCap = "round";
      canvasContext.beginPath();
      canvasContext.moveTo(sourceAttr.x * CANVAS_WIDTH, sourceAttr.y * CANVAS_HEIGHT);
      canvasContext.lineTo(targetAttr.x * CANVAS_WIDTH, targetAttr.y * CANVAS_HEIGHT);
      canvasContext.stroke();
    });

    // Render nodes and labels
    graph.forEachNode((node, attr) => {
      // Draw node shadow
      canvasContext.beginPath();
      canvasContext.arc(
        attr.x * CANVAS_WIDTH + 2,
        attr.y * CANVAS_HEIGHT + 2,
        attr.size,
        0,
        2 * Math.PI
      );
      canvasContext.fillStyle = "rgba(0,0,0,0.1)";
      canvasContext.fill();

      // Draw node
      canvasContext.beginPath();
      canvasContext.arc(
        attr.x * CANVAS_WIDTH,
        attr.y * CANVAS_HEIGHT,
        attr.size,
        0,
        2 * Math.PI
      );
      canvasContext.fillStyle = attr.color;
      canvasContext.fill();

      // Render labels with coordinates
      const coordinatesText = `(${attr.coordinates.join(", ")})`;
      canvasContext.fillStyle = "#374151";
      canvasContext.font = "500 12px Inter, sans-serif";
      canvasContext.fillText(
        `${attr.label}`,
        attr.x * CANVAS_WIDTH + attr.size + 8,
        attr.y * CANVAS_HEIGHT - 4
      );
      canvasContext.font = "400 11px monospace";
      canvasContext.fillStyle = "#6b7280";
      canvasContext.fillText(
        coordinatesText,
        attr.x * CANVAS_WIDTH + attr.size + 8,
        attr.y * CANVAS_HEIGHT + 10
      );
    });
  });

  return (
    <main class="container py-6">
      <Title>Graph Exploration | Dimension Folding</Title>

      {/* Page header */}
      <div class="mb-6">
        <div class="flex items-center gap-3 mb-2">
          <h1 class="text-2xl font-bold tracking-tight">Graph Exploration</h1>
          <Badge variant="secondary">K₁,₂ (V-Graph)</Badge>
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

        {/* 3D Linkage view */}
        <ThreeJSGraph
          graph={graph}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          setCoordinates={setCoordinates}
        />
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
            </TabsList>
            <TabsContent value="adjacency">
              <div class="max-w-md">
                <MatrixTable
                  title="Adjacency Matrix"
                  rowLabels={adjacencyLabels}
                  colLabels={adjacencyLabels}
                  matrix={adjacencyMatrix}
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
                  rowLabels={incidenceRowLabels}
                  colLabels={incidenceColLabels}
                  matrix={incidenceMatrix}
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
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}
