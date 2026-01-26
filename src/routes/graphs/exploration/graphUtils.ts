// graphUtils.ts - Graph construction utilities
import Graph from "graphology";
import { applyLayout } from "./layout";
import { assignIndependentCoordinates } from "./matrixUtils";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Node attributes for graph visualization.
 */
export interface NodeAttributes {
  label: string;
  size: number;
  color: string;
  coordinates: [number, number, number];
  x: number;
  y: number;
}

/**
 * Partial node attributes used during graph construction
 * before layout and coordinates are assigned.
 */
interface NodeAttributesPartial {
  label: string;
  size: number;
  color: string;
  coordinates?: [number, number, number];
  x?: number;
  y?: number;
}

/**
 * Edge attributes for graph visualization.
 */
export interface EdgeAttributes {
  size: number;
  color: string;
}

/**
 * Graph type with full node and edge attributes.
 */
export type FrameworkGraph = Graph<NodeAttributes, EdgeAttributes>;

/**
 * Metadata about a graph for display in the selector.
 */
export interface GraphInfo {
  id: string;
  name: string;
  description: string;
  vertices: number;
  edges: number;
  expectedRigid: boolean;
  category: "complete" | "bipartite" | "cycle" | "path" | "platonic" | "other";
}

// ============================================================================
// Color Palettes
// ============================================================================

const NODE_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#22c55e", // green
  "#a855f7", // purple
  "#f97316", // orange
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#eab308", // yellow
];

const EDGE_COLORS = [
  "#8b5cf6", // purple
  "#f97316", // orange
  "#6b7280", // gray
  "#14b8a6", // teal
  "#f43f5e", // rose
];

/**
 * Get a color from the palette by index (wraps around).
 */
function getNodeColor(index: number): string {
  return NODE_COLORS[index % NODE_COLORS.length];
}

function getEdgeColor(index: number): string {
  return EDGE_COLORS[index % EDGE_COLORS.length];
}

// ============================================================================
// Graph Factory Helper
// ============================================================================

/**
 * Finalize a graph by applying layout and assigning 3D coordinates.
 * This mutates the graph in place and returns it with full attributes.
 */
function finalizeGraph(graph: Graph<NodeAttributesPartial, EdgeAttributes>): FrameworkGraph {
  applyLayout(graph);
  assignIndependentCoordinates(graph);
  return graph as unknown as FrameworkGraph;
}

// ============================================================================
// Complete Graphs (Kₙ)
// ============================================================================

/**
 * Create K₃ - Triangle (complete graph on 3 vertices).
 * Rigid in ℝ² and ℝ³.
 */
export function createK3Graph(): FrameworkGraph {
  const graph = new Graph<NodeAttributesPartial, EdgeAttributes>();

  graph.addNode("1", { label: "v₁", size: 10, color: getNodeColor(0) });
  graph.addNode("2", { label: "v₂", size: 10, color: getNodeColor(1) });
  graph.addNode("3", { label: "v₃", size: 10, color: getNodeColor(2) });

  graph.addEdge("1", "2", { size: 3, color: getEdgeColor(0) });
  graph.addEdge("2", "3", { size: 3, color: getEdgeColor(1) });
  graph.addEdge("1", "3", { size: 3, color: getEdgeColor(2) });

  return finalizeGraph(graph);
}

/**
 * Create K₄ - Tetrahedron (complete graph on 4 vertices).
 * Rigid in ℝ³.
 */
export function createK4Graph(): FrameworkGraph {
  const graph = new Graph<NodeAttributesPartial, EdgeAttributes>();

  graph.addNode("1", { label: "v₁", size: 10, color: getNodeColor(0) });
  graph.addNode("2", { label: "v₂", size: 10, color: getNodeColor(1) });
  graph.addNode("3", { label: "v₃", size: 10, color: getNodeColor(2) });
  graph.addNode("4", { label: "v₄", size: 10, color: getNodeColor(3) });

  // All 6 edges of K₄
  graph.addEdge("1", "2", { size: 3, color: getEdgeColor(0) });
  graph.addEdge("1", "3", { size: 3, color: getEdgeColor(1) });
  graph.addEdge("1", "4", { size: 3, color: getEdgeColor(2) });
  graph.addEdge("2", "3", { size: 3, color: getEdgeColor(3) });
  graph.addEdge("2", "4", { size: 3, color: getEdgeColor(4) });
  graph.addEdge("3", "4", { size: 3, color: getEdgeColor(0) });

  return finalizeGraph(graph);
}

/**
 * Create K₅ - Complete graph on 5 vertices.
 * Over-constrained in ℝ³.
 */
export function createK5Graph(): FrameworkGraph {
  const graph = new Graph<NodeAttributesPartial, EdgeAttributes>();

  for (let i = 1; i <= 5; i++) {
    graph.addNode(String(i), { label: `v${i}`, size: 10, color: getNodeColor(i - 1) });
  }

  let edgeIdx = 0;
  for (let i = 1; i <= 5; i++) {
    for (let j = i + 1; j <= 5; j++) {
      graph.addEdge(String(i), String(j), { size: 3, color: getEdgeColor(edgeIdx++) });
    }
  }

  return finalizeGraph(graph);
}

/**
 * Create Kₙ - Complete graph on n vertices.
 */
export function createKnGraph(n: number): FrameworkGraph {
  const graph = new Graph<NodeAttributesPartial, EdgeAttributes>();

  for (let i = 1; i <= n; i++) {
    graph.addNode(String(i), { label: `v${i}`, size: 10, color: getNodeColor(i - 1) });
  }

  let edgeIdx = 0;
  for (let i = 1; i <= n; i++) {
    for (let j = i + 1; j <= n; j++) {
      graph.addEdge(String(i), String(j), { size: 3, color: getEdgeColor(edgeIdx++) });
    }
  }

  return finalizeGraph(graph);
}

// ============================================================================
// Path and Cycle Graphs
// ============================================================================

/**
 * Create V-graph (K₁,₂ or path P₃) - Two edges sharing a vertex.
 * Flexible with 1 DOF (hinge motion).
 */
export function createVGraph(): FrameworkGraph {
  const graph = new Graph<NodeAttributesPartial, EdgeAttributes>();

  graph.addNode("1", { label: "v₁", size: 10, color: getNodeColor(0) });
  graph.addNode("2", { label: "v₂", size: 12, color: getNodeColor(1) }); // Slightly larger for center
  graph.addNode("3", { label: "v₃", size: 10, color: getNodeColor(2) });

  graph.addEdge("1", "2", { size: 3, color: getEdgeColor(0) });
  graph.addEdge("2", "3", { size: 3, color: getEdgeColor(1) });

  return finalizeGraph(graph);
}

/**
 * Create Pₙ - Path graph on n vertices.
 * Highly flexible with n-2 internal DOF.
 */
export function createPathGraph(n: number): FrameworkGraph {
  const graph = new Graph<NodeAttributesPartial, EdgeAttributes>();

  for (let i = 1; i <= n; i++) {
    graph.addNode(String(i), { label: `v${i}`, size: 10, color: getNodeColor(i - 1) });
  }

  for (let i = 1; i < n; i++) {
    graph.addEdge(String(i), String(i + 1), { size: 3, color: getEdgeColor(i - 1) });
  }

  return finalizeGraph(graph);
}

/**
 * Create Cₙ - Cycle graph on n vertices.
 * C₃ = K₃ (rigid triangle).
 * C₄ and larger are flexible in ℝ³.
 */
export function createCycleGraph(n: number): FrameworkGraph {
  if (n < 3) throw new Error("Cycle requires at least 3 vertices");

  const graph = new Graph<NodeAttributesPartial, EdgeAttributes>();

  for (let i = 1; i <= n; i++) {
    graph.addNode(String(i), { label: `v${i}`, size: 10, color: getNodeColor(i - 1) });
  }

  for (let i = 1; i <= n; i++) {
    const next = i === n ? 1 : i + 1;
    graph.addEdge(String(i), String(next), { size: 3, color: getEdgeColor(i - 1) });
  }

  return finalizeGraph(graph);
}

// ============================================================================
// Bipartite Graphs (Kₘ,ₙ)
// ============================================================================

/**
 * Create K₂,₃ - Complete bipartite graph.
 * Flexible in ℝ³.
 */
export function createK23Graph(): FrameworkGraph {
  return createKmnGraph(2, 3);
}

/**
 * Create K₃,₃ - Complete bipartite graph.
 * Famous for being non-planar.
 */
export function createK33Graph(): FrameworkGraph {
  return createKmnGraph(3, 3);
}

/**
 * Create Kₘ,ₙ - Complete bipartite graph.
 * Vertices are partitioned into sets A (m vertices) and B (n vertices).
 * Every vertex in A is connected to every vertex in B.
 */
export function createKmnGraph(m: number, n: number): FrameworkGraph {
  const graph = new Graph<NodeAttributesPartial, EdgeAttributes>();

  // Partition A: vertices 1 to m
  for (let i = 1; i <= m; i++) {
    graph.addNode(`a${i}`, { label: `a${i}`, size: 10, color: getNodeColor(0) });
  }

  // Partition B: vertices 1 to n
  for (let j = 1; j <= n; j++) {
    graph.addNode(`b${j}`, { label: `b${j}`, size: 10, color: getNodeColor(1) });
  }

  // All edges between A and B
  let edgeIdx = 0;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      graph.addEdge(`a${i}`, `b${j}`, { size: 3, color: getEdgeColor(edgeIdx++) });
    }
  }

  return finalizeGraph(graph);
}

// ============================================================================
// Wheel and Special Graphs
// ============================================================================

/**
 * Create Wₙ - Wheel graph on n+1 vertices.
 * A cycle Cₙ with an additional central vertex connected to all cycle vertices.
 * W₃ = K₄ (tetrahedron).
 */
export function createWheelGraph(n: number): FrameworkGraph {
  if (n < 3) throw new Error("Wheel requires at least 3 rim vertices");

  const graph = new Graph<NodeAttributesPartial, EdgeAttributes>();

  // Center vertex
  graph.addNode("0", { label: "center", size: 12, color: getNodeColor(0) });

  // Rim vertices
  for (let i = 1; i <= n; i++) {
    graph.addNode(String(i), { label: `v${i}`, size: 10, color: getNodeColor(i) });
  }

  // Rim edges (cycle)
  for (let i = 1; i <= n; i++) {
    const next = i === n ? 1 : i + 1;
    graph.addEdge(String(i), String(next), { size: 3, color: getEdgeColor(0) });
  }

  // Spoke edges (center to rim)
  for (let i = 1; i <= n; i++) {
    graph.addEdge("0", String(i), { size: 3, color: getEdgeColor(1) });
  }

  return finalizeGraph(graph);
}

/**
 * Create Q₃ - 3-dimensional hypercube (cube skeleton).
 * 8 vertices, 12 edges.
 * Flexible in ℝ³.
 */
export function createCubeGraph(): FrameworkGraph {
  const graph = new Graph<NodeAttributesPartial, EdgeAttributes>();

  // Vertices labeled by binary: 000, 001, 010, 011, 100, 101, 110, 111
  const vertices = ["000", "001", "010", "011", "100", "101", "110", "111"];

  vertices.forEach((v, i) => {
    graph.addNode(v, { label: v, size: 10, color: getNodeColor(i) });
  });

  // Edges connect vertices differing in exactly one bit
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      const diff = (parseInt(vertices[i], 2) ^ parseInt(vertices[j], 2)).toString(2);
      // Check if exactly one bit differs (power of 2)
      if (diff === "1" || diff === "10" || diff === "100") {
        graph.addEdge(vertices[i], vertices[j], { size: 3, color: getEdgeColor(0) });
      }
    }
  }

  return finalizeGraph(graph);
}

/**
 * Create Octahedron graph.
 * 6 vertices, 12 edges.
 * Rigid in ℝ³.
 */
export function createOctahedronGraph(): FrameworkGraph {
  const graph = new Graph<NodeAttributesPartial, EdgeAttributes>();

  // 6 vertices: top, bottom, and 4 equatorial
  graph.addNode("top", { label: "top", size: 10, color: getNodeColor(0) });
  graph.addNode("bottom", { label: "bottom", size: 10, color: getNodeColor(1) });
  graph.addNode("n", { label: "N", size: 10, color: getNodeColor(2) });
  graph.addNode("e", { label: "E", size: 10, color: getNodeColor(3) });
  graph.addNode("s", { label: "S", size: 10, color: getNodeColor(4) });
  graph.addNode("w", { label: "W", size: 10, color: getNodeColor(5) });

  // Top to equatorial
  graph.addEdge("top", "n", { size: 3, color: getEdgeColor(0) });
  graph.addEdge("top", "e", { size: 3, color: getEdgeColor(0) });
  graph.addEdge("top", "s", { size: 3, color: getEdgeColor(0) });
  graph.addEdge("top", "w", { size: 3, color: getEdgeColor(0) });

  // Bottom to equatorial
  graph.addEdge("bottom", "n", { size: 3, color: getEdgeColor(1) });
  graph.addEdge("bottom", "e", { size: 3, color: getEdgeColor(1) });
  graph.addEdge("bottom", "s", { size: 3, color: getEdgeColor(1) });
  graph.addEdge("bottom", "w", { size: 3, color: getEdgeColor(1) });

  // Equatorial cycle
  graph.addEdge("n", "e", { size: 3, color: getEdgeColor(2) });
  graph.addEdge("e", "s", { size: 3, color: getEdgeColor(2) });
  graph.addEdge("s", "w", { size: 3, color: getEdgeColor(2) });
  graph.addEdge("w", "n", { size: 3, color: getEdgeColor(2) });

  return finalizeGraph(graph);
}

/**
 * Create K_{2,2,2} - Complete tripartite graph (octahedron graph).
 * 6 vertices in 3 sets of 2, each connected to all vertices in other sets.
 * Also known as the cocktail party graph or hyperoctahedral graph.
 * d_min = 4 (requires 4D for generic rigid embedding).
 */
export function createK222Graph(): FrameworkGraph {
  const graph = new Graph<NodeAttributesPartial, EdgeAttributes>();

  // Set A: vertices 1, 2
  graph.addNode("a1", { label: "a₁", size: 10, color: getNodeColor(0) });
  graph.addNode("a2", { label: "a₂", size: 10, color: getNodeColor(0) });
  
  // Set B: vertices 3, 4
  graph.addNode("b1", { label: "b₁", size: 10, color: getNodeColor(1) });
  graph.addNode("b2", { label: "b₂", size: 10, color: getNodeColor(1) });
  
  // Set C: vertices 5, 6
  graph.addNode("c1", { label: "c₁", size: 10, color: getNodeColor(2) });
  graph.addNode("c2", { label: "c₂", size: 10, color: getNodeColor(2) });

  // All edges between A and B
  graph.addEdge("a1", "b1", { size: 3, color: getEdgeColor(0) });
  graph.addEdge("a1", "b2", { size: 3, color: getEdgeColor(0) });
  graph.addEdge("a2", "b1", { size: 3, color: getEdgeColor(0) });
  graph.addEdge("a2", "b2", { size: 3, color: getEdgeColor(0) });

  // All edges between A and C
  graph.addEdge("a1", "c1", { size: 3, color: getEdgeColor(1) });
  graph.addEdge("a1", "c2", { size: 3, color: getEdgeColor(1) });
  graph.addEdge("a2", "c1", { size: 3, color: getEdgeColor(1) });
  graph.addEdge("a2", "c2", { size: 3, color: getEdgeColor(1) });

  // All edges between B and C
  graph.addEdge("b1", "c1", { size: 3, color: getEdgeColor(2) });
  graph.addEdge("b1", "c2", { size: 3, color: getEdgeColor(2) });
  graph.addEdge("b2", "c1", { size: 3, color: getEdgeColor(2) });
  graph.addEdge("b2", "c2", { size: 3, color: getEdgeColor(2) });

  return finalizeGraph(graph);
}

/**
 * Create Square Pyramid - Octahedron minus one vertex.
 * 5 vertices: 4 forming a square base, 1 apex.
 * The base is a cycle C₄ (flexible), apex connects to all base vertices.
 * d_min = 3 (the square can collapse but requires 3D for apex constraint).
 */
export function createSquarePyramidGraph(): FrameworkGraph {
  const graph = new Graph<NodeAttributesPartial, EdgeAttributes>();

  // Apex
  graph.addNode("apex", { label: "apex", size: 12, color: getNodeColor(0) });
  
  // Square base vertices
  graph.addNode("1", { label: "v₁", size: 10, color: getNodeColor(1) });
  graph.addNode("2", { label: "v₂", size: 10, color: getNodeColor(2) });
  graph.addNode("3", { label: "v₃", size: 10, color: getNodeColor(3) });
  graph.addNode("4", { label: "v₄", size: 10, color: getNodeColor(4) });

  // Square base edges (cycle)
  graph.addEdge("1", "2", { size: 3, color: getEdgeColor(0) });
  graph.addEdge("2", "3", { size: 3, color: getEdgeColor(0) });
  graph.addEdge("3", "4", { size: 3, color: getEdgeColor(0) });
  graph.addEdge("4", "1", { size: 3, color: getEdgeColor(0) });

  // Apex to all base vertices
  graph.addEdge("apex", "1", { size: 3, color: getEdgeColor(1) });
  graph.addEdge("apex", "2", { size: 3, color: getEdgeColor(1) });
  graph.addEdge("apex", "3", { size: 3, color: getEdgeColor(1) });
  graph.addEdge("apex", "4", { size: 3, color: getEdgeColor(1) });

  return finalizeGraph(graph);
}

// ============================================================================
// Graph Registry
// ============================================================================

/**
 * All available graphs with their metadata.
 */
export const GRAPH_REGISTRY: { info: GraphInfo; create: () => FrameworkGraph }[] = [
  {
    info: {
      id: "v-graph",
      name: "V-Graph (P₃)",
      description: "Path with 3 vertices - flexible hinge",
      vertices: 3,
      edges: 2,
      expectedRigid: false,
      category: "path",
    },
    create: createVGraph,
  },
  {
    info: {
      id: "k3",
      name: "Triangle (K₃)",
      description: "Complete graph on 3 vertices - rigid",
      vertices: 3,
      edges: 3,
      expectedRigid: true,
      category: "complete",
    },
    create: createK3Graph,
  },
  {
    info: {
      id: "k4",
      name: "Tetrahedron (K₄)",
      description: "Complete graph on 4 vertices - rigid in ℝ³",
      vertices: 4,
      edges: 6,
      expectedRigid: true,
      category: "complete",
    },
    create: createK4Graph,
  },
  {
    info: {
      id: "k5",
      name: "K₅",
      description: "Complete graph on 5 vertices - over-constrained",
      vertices: 5,
      edges: 10,
      expectedRigid: true,
      category: "complete",
    },
    create: createK5Graph,
  },
  {
    info: {
      id: "c4",
      name: "Square (C₄)",
      description: "Cycle on 4 vertices - flexible",
      vertices: 4,
      edges: 4,
      expectedRigid: false,
      category: "cycle",
    },
    create: () => createCycleGraph(4),
  },
  {
    info: {
      id: "c5",
      name: "Pentagon (C₅)",
      description: "Cycle on 5 vertices - flexible",
      vertices: 5,
      edges: 5,
      expectedRigid: false,
      category: "cycle",
    },
    create: () => createCycleGraph(5),
  },
  {
    info: {
      id: "c6",
      name: "Hexagon (C₆)",
      description: "Cycle on 6 vertices - flexible",
      vertices: 6,
      edges: 6,
      expectedRigid: false,
      category: "cycle",
    },
    create: () => createCycleGraph(6),
  },
  {
    info: {
      id: "p4",
      name: "Path (P₄)",
      description: "Path with 4 vertices - very flexible",
      vertices: 4,
      edges: 3,
      expectedRigid: false,
      category: "path",
    },
    create: () => createPathGraph(4),
  },
  {
    info: {
      id: "k23",
      name: "K₂,₃",
      description: "Complete bipartite graph - flexible",
      vertices: 5,
      edges: 6,
      expectedRigid: false,
      category: "bipartite",
    },
    create: createK23Graph,
  },
  {
    info: {
      id: "k33",
      name: "K₃,₃",
      description: "Complete bipartite graph - non-planar",
      vertices: 6,
      edges: 9,
      expectedRigid: false,
      category: "bipartite",
    },
    create: createK33Graph,
  },
  {
    info: {
      id: "w4",
      name: "Wheel (W₄)",
      description: "Wheel with 4 rim vertices",
      vertices: 5,
      edges: 8,
      expectedRigid: true,
      category: "other",
    },
    create: () => createWheelGraph(4),
  },
  {
    info: {
      id: "cube",
      name: "Cube (Q₃)",
      description: "3D hypercube skeleton - flexible",
      vertices: 8,
      edges: 12,
      expectedRigid: false,
      category: "platonic",
    },
    create: createCubeGraph,
  },
  {
    info: {
      id: "octahedron",
      name: "Octahedron",
      description: "Octahedron skeleton - rigid in ℝ³",
      vertices: 6,
      edges: 12,
      expectedRigid: true,
      category: "platonic",
    },
    create: createOctahedronGraph,
  },
  {
    info: {
      id: "k222",
      name: "K₂,₂,₂",
      description: "Complete tripartite graph - d_min = 4",
      vertices: 6,
      edges: 12,
      expectedRigid: true,
      category: "other",
    },
    create: createK222Graph,
  },
  {
    info: {
      id: "square-pyramid",
      name: "Square Pyramid",
      description: "Octahedron minus one vertex - d_min = 3",
      vertices: 5,
      edges: 8,
      expectedRigid: true,
      category: "other",
    },
    create: createSquarePyramidGraph,
  },
];

/**
 * Get a graph by its ID from the registry.
 */
export function getGraphById(id: string): FrameworkGraph | null {
  const entry = GRAPH_REGISTRY.find((g) => g.info.id === id);
  return entry ? entry.create() : null;
}

/**
 * Get graph info by ID.
 */
export function getGraphInfoById(id: string): GraphInfo | null {
  const entry = GRAPH_REGISTRY.find((g) => g.info.id === id);
  return entry?.info ?? null;
}
