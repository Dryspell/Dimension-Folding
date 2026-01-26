// dimensionReduction.ts - Dimension reduction game via degrees of freedom and motions
//
// Key insight from the CONSTRUCTION game:
// - A vertex with k connections has (d - k) degrees of freedom in ℝᵈ
// - DOF > 0 means the vertex can move while preserving edge lengths
// - These motions can potentially reduce the affine dimension
//
// The FOLDING game asks:
// - Which vertices have DOF > 0? (flexible vertices)
// - Is there a motion that moves vertices into a lower-dimensional subspace?
// - Can we continuously deform from dimension n-1 to d_min?
//
// We track both COORDINATES and EDGE VECTORS.
// - Coordinates: position of each vertex
// - Edge vectors: difference vectors (v_target - v_source) for each edge

import Graph from "graphology";

/**
 * A vertex with its current coordinate vector.
 */
export interface VertexCoordinates {
  id: string;
  label: string;
  /** Coordinate vector (length = number of dimensions) */
  coords: number[];
  /** Color for display */
  color: string;
}

/**
 * An edge constraint between two vertices.
 */
export interface EdgeConstraint {
  /** Edge ID (source-target) */
  id: string;
  source: string;
  target: string;
  sourceLabel: string;
  targetLabel: string;
}

/**
 * An edge vector (difference between target and source coordinates).
 */
export interface EdgeVector {
  /** Edge ID (source-target) */
  id: string;
  /** Source vertex ID */
  source: string;
  /** Target vertex ID */
  target: string;
  /** Labels for display */
  sourceLabel: string;
  targetLabel: string;
  /** The edge vector = coords[target] - coords[source] */
  vector: number[];
  /** Length of the edge (preserved during valid transformations) */
  length: number;
}

/**
 * Degrees of freedom analysis for a vertex.
 */
export interface VertexDOF {
  id: string;
  label: string;
  /** Number of edges connected to this vertex */
  degree: number;
  /** Degrees of freedom = currentDimension - degree (clamped to 0) */
  dof: number;
  /** Is this vertex flexible (DOF > 0)? */
  isFlexible: boolean;
  /** Can this vertex potentially enable dimension reduction? */
  canReduceDimension: boolean;
}

/**
 * A possible motion that could reduce dimension.
 */
export interface DimensionReducingMotion {
  /** Vertex that can move */
  vertexId: string;
  vertexLabel: string;
  /** DOF of this vertex */
  dof: number;
  /** Description of the motion */
  description: string;
  /** Target dimension after this motion */
  targetDimension: number;
  /** Does this motion preserve all edge lengths? */
  preservesLengths: boolean;
}

/**
 * State of the dimension reduction game.
 */
export interface ReductionState {
  /** Current vertex coordinates */
  vertices: VertexCoordinates[];
  /** Edge constraints */
  edges: EdgeConstraint[];
  /** Edge vectors (derived from coordinates) */
  edgeVectors: EdgeVector[];
  /** Number of dimensions (columns in coordinate matrix) */
  numDimensions: number;
  /** Current effective dimension (rank of coordinate matrix) */
  currentRank: number;
  /** Rank of the edge vector matrix = affine dimension = d_min upper bound */
  edgeVectorRank: number;
  /** DOF analysis for each vertex */
  vertexDOFs: VertexDOF[];
  /** Total degrees of freedom of the system */
  totalDOF: number;
  /** Is the graph flexible (totalDOF > 0)? */
  isFlexible: boolean;
  /** History for undo */
  history: VertexCoordinates[][];
  /** Message describing last action */
  message: string;
  /** Is the game complete (cannot reduce further)? */
  isComplete: boolean;
}

/**
 * A potential row operation (for exploration, may not preserve edge lengths).
 */
export interface RowOperation {
  /** Type of operation */
  type: "add" | "subtract" | "zero_column";
  /** Source row (vertex being modified) */
  targetVertex: string;
  /** Row to add/subtract from (if applicable) */
  sourceVertex?: string;
  /** Column to zero out */
  column?: number;
  /** Description of the operation */
  description: string;
  /** Is this operation "safe" (justified by an edge)? */
  isSafe: boolean;
  /** Resulting rank after operation */
  resultingRank: number;
}

/**
 * A geometrically valid folding operation.
 * These operations preserve edge lengths while reducing dimension.
 */
export interface FoldingOperation {
  /** Type of folding */
  type: "align_edge" | "collapse_to_point" | "hinge_fold";
  /** The edge being transformed (for align_edge) */
  edgeId?: string;
  /** Target edge to align with (for align_edge) */
  targetEdgeId?: string;
  /** Hinge info (for hinge_fold) */
  hinge?: {
    axisVertices: [string, string];  // The shared edge forming the hinge axis
    movingClique: string[];          // Vertices of the clique being rotated
    fixedClique: string[];           // Vertices of the clique staying fixed
  };
  /** Description */
  description: string;
  /** Resulting coordinate rank */
  resultingCoordRank: number;
  /** Resulting edge rank */
  resultingEdgeRank: number;
  /** Does this preserve all edge lengths? */
  preservesLengths: boolean;
}

/**
 * A rigid substructure (clique) in the graph.
 */
export interface RigidClique {
  vertices: string[];
  dimension: number;  // K_n is rigid in (n-1) dimensions
}

/**
 * A hinge between two rigid cliques.
 */
export interface Hinge {
  id: string;
  axisVertices: string[];  // Shared vertices (edge = 2 vertices)
  cliqueA: RigidClique;
  cliqueB: RigidClique;
  axisDimension: number;   // 1 for edge hinge, 0 for vertex hinge
}

// Color palette
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
 * Compute edge vectors from vertex coordinates.
 */
export function computeEdgeVectors(
  vertices: VertexCoordinates[],
  edges: EdgeConstraint[]
): EdgeVector[] {
  const vertexMap = new Map(vertices.map(v => [v.id, v]));
  
  return edges.map(edge => {
    const source = vertexMap.get(edge.source);
    const target = vertexMap.get(edge.target);
    
    if (!source || !target) {
      return {
        id: `${edge.sourceLabel}-${edge.targetLabel}`,
        source: edge.source,
        target: edge.target,
        sourceLabel: edge.sourceLabel,
        targetLabel: edge.targetLabel,
        vector: [],
        length: 0,
      };
    }
    
    // Edge vector = target - source
    const vector = target.coords.map((c, i) => c - source.coords[i]);
    const length = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    
    return {
      id: `${edge.sourceLabel}-${edge.targetLabel}`,
      source: edge.source,
      target: edge.target,
      sourceLabel: edge.sourceLabel,
      targetLabel: edge.targetLabel,
      vector,
      length,
    };
  });
}

/**
 * Initialize the reduction game from a graph.
 * Each vertex gets a 1 in its own independent dimension.
 */
export function initializeReduction(graph: Graph): ReductionState {
  const vertices: VertexCoordinates[] = [];
  const edges: EdgeConstraint[] = [];
  const n = graph.order;

  let colorIndex = 0;
  graph.forEachNode((nodeId, attrs) => {
    const label = (attrs.label as string) || nodeId;
    const coords = new Array(n).fill(0);
    coords[colorIndex] = 1; // Identity-like: vertex i has 1 in dimension i
    
    vertices.push({
      id: nodeId,
      label,
      coords,
      color: VERTEX_COLORS[colorIndex % VERTEX_COLORS.length],
    });
    colorIndex++;
  });

  graph.forEachEdge((edgeId, attrs, source, target) => {
    const sourceAttrs = graph.getNodeAttributes(source);
    const targetAttrs = graph.getNodeAttributes(target);
    const sourceLabel = (sourceAttrs.label as string) || source;
    const targetLabel = (targetAttrs.label as string) || target;
    edges.push({
      id: `${sourceLabel}-${targetLabel}`,  // Must match EdgeVector id format
      source,
      target,
      sourceLabel,
      targetLabel,
    });
  });

  const edgeVectors = computeEdgeVectors(vertices, edges);
  const currentRank = computeRank(vertices.map(v => v.coords));
  const edgeVectorRank = computeRank(edgeVectors.map(ev => ev.vector));
  
  // Compute DOF for each vertex
  const vertexDOFs = computeVertexDOFs(vertices, edges, edgeVectorRank);
  const totalDOF = vertexDOFs.reduce((sum, v) => sum + v.dof, 0);
  const isFlexible = totalDOF > 0;

  return {
    vertices,
    edges,
    edgeVectors,
    numDimensions: n,
    currentRank,
    edgeVectorRank,
    vertexDOFs,
    totalDOF,
    isFlexible,
    history: [],
    message: isFlexible 
      ? `Flexible graph: ${totalDOF} total DOF. Some vertices can move.`
      : `Rigid graph: No degrees of freedom. Cannot fold further.`,
    isComplete: !isFlexible,
  };
}

/**
 * Compute degrees of freedom for each vertex.
 * 
 * In dimension d, a vertex with k edge constraints has (d - k) DOF.
 * DOF > 0 means the vertex can move while preserving edge lengths.
 */
export function computeVertexDOFs(
  vertices: VertexCoordinates[],
  edges: EdgeConstraint[],
  currentDimension: number
): VertexDOF[] {
  // Count degree (number of edges) for each vertex
  const degreeMap = new Map<string, number>();
  for (const v of vertices) {
    degreeMap.set(v.id, 0);
  }
  for (const e of edges) {
    degreeMap.set(e.source, (degreeMap.get(e.source) ?? 0) + 1);
    degreeMap.set(e.target, (degreeMap.get(e.target) ?? 0) + 1);
  }
  
  return vertices.map(v => {
    const degree = degreeMap.get(v.id) ?? 0;
    // DOF = dimension - constraints, but clamped to >= 0
    // Note: first vertex could be considered "pinned" (subtract d for global translation)
    // For simplicity, we compute raw DOF here
    const dof = Math.max(0, currentDimension - degree);
    const isFlexible = dof > 0;
    // A vertex can help reduce dimension if it's flexible and not maximally constrained
    const canReduceDimension = isFlexible && degree < currentDimension;
    
    return {
      id: v.id,
      label: v.label,
      degree,
      dof,
      isFlexible,
      canReduceDimension,
    };
  });
}

/**
 * Compute the rank of a matrix (array of row vectors).
 */
export function computeRank(matrix: number[][]): number {
  if (matrix.length === 0) return 0;
  
  const m = matrix.length;
  const n = matrix[0].length;
  
  // Create a copy for row reduction
  const A = matrix.map(row => [...row]);
  
  let rank = 0;
  const rowUsed = new Array(m).fill(false);
  
  for (let col = 0; col < n; col++) {
    // Find pivot
    let pivotRow = -1;
    for (let row = 0; row < m; row++) {
      if (!rowUsed[row] && Math.abs(A[row][col]) > 1e-10) {
        pivotRow = row;
        break;
      }
    }
    
    if (pivotRow === -1) continue;
    
    rowUsed[pivotRow] = true;
    rank++;
    
    // Eliminate this column in other rows
    for (let row = 0; row < m; row++) {
      if (row !== pivotRow && Math.abs(A[row][col]) > 1e-10) {
        const factor = A[row][col] / A[pivotRow][col];
        for (let j = 0; j < n; j++) {
          A[row][j] -= factor * A[pivotRow][j];
        }
      }
    }
  }
  
  return rank;
}

/**
 * Check if two vertices are connected by an edge.
 */
export function hasEdge(state: ReductionState, v1: string, v2: string): boolean {
  return state.edges.some(
    e => (e.source === v1 && e.target === v2) || (e.source === v2 && e.target === v1)
  );
}

/**
 * Get all possible row operations.
 * "Safe" operations are those justified by edge relationships.
 */
export function getPossibleOperations(state: ReductionState): RowOperation[] {
  const operations: RowOperation[] = [];
  const vertices = state.vertices;

  // For each pair of vertices connected by an edge,
  // we can combine their coordinates
  for (const edge of state.edges) {
    const v1 = vertices.find(v => v.id === edge.source);
    const v2 = vertices.find(v => v.id === edge.target);
    if (!v1 || !v2) continue;

    // Add v2's row to v1's row (modify v1)
    const resultAdd1 = vertices.map(v => 
      v.id === v1.id 
        ? { ...v, coords: v.coords.map((c, i) => c + v2.coords[i]) }
        : v
    );
    const rankAdd1 = computeRank(resultAdd1.map(v => v.coords));
    
    operations.push({
      type: "add",
      targetVertex: v1.id,
      sourceVertex: v2.id,
      description: `${v1.label} += ${v2.label}`,
      isSafe: true,
      resultingRank: rankAdd1,
    });

    // Add v1's row to v2's row (modify v2)
    const resultAdd2 = vertices.map(v => 
      v.id === v2.id 
        ? { ...v, coords: v.coords.map((c, i) => c + v1.coords[i]) }
        : v
    );
    const rankAdd2 = computeRank(resultAdd2.map(v => v.coords));
    
    operations.push({
      type: "add",
      targetVertex: v2.id,
      sourceVertex: v1.id,
      description: `${v2.label} += ${v1.label}`,
      isSafe: true,
      resultingRank: rankAdd2,
    });

    // Subtract v2's row from v1's row
    const resultSub1 = vertices.map(v => 
      v.id === v1.id 
        ? { ...v, coords: v.coords.map((c, i) => c - v2.coords[i]) }
        : v
    );
    const rankSub1 = computeRank(resultSub1.map(v => v.coords));
    
    operations.push({
      type: "subtract",
      targetVertex: v1.id,
      sourceVertex: v2.id,
      description: `${v1.label} -= ${v2.label}`,
      isSafe: true,
      resultingRank: rankSub1,
    });

    // Subtract v1's row from v2's row
    const resultSub2 = vertices.map(v => 
      v.id === v2.id 
        ? { ...v, coords: v.coords.map((c, i) => c - v1.coords[i]) }
        : v
    );
    const rankSub2 = computeRank(resultSub2.map(v => v.coords));
    
    operations.push({
      type: "subtract",
      targetVertex: v2.id,
      sourceVertex: v1.id,
      description: `${v2.label} -= ${v1.label}`,
      isSafe: true,
      resultingRank: rankSub2,
    });
  }

  // Sort by resulting rank (prefer operations that reduce rank)
  operations.sort((a, b) => a.resultingRank - b.resultingRank);

  // Remove duplicates
  const seen = new Set<string>();
  return operations.filter(op => {
    const key = `${op.type}-${op.targetVertex}-${op.sourceVertex}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Perform a row operation.
 */
export function performOperation(
  state: ReductionState,
  operation: RowOperation
): ReductionState {
  const newVertices = state.vertices.map(v => ({ ...v, coords: [...v.coords] }));
  
  const target = newVertices.find(v => v.id === operation.targetVertex);
  const source = operation.sourceVertex 
    ? newVertices.find(v => v.id === operation.sourceVertex)
    : null;

  if (!target) {
    return { ...state, message: "Invalid operation: target not found" };
  }

  if (operation.type === "add" && source) {
    target.coords = target.coords.map((c, i) => c + source.coords[i]);
  } else if (operation.type === "subtract" && source) {
    target.coords = target.coords.map((c, i) => c - source.coords[i]);
  }

  // Recompute edge vectors
  const newEdgeVectors = computeEdgeVectors(newVertices, state.edges);
  
  const newRank = computeRank(newVertices.map(v => v.coords));
  const newEdgeRank = computeRank(newEdgeVectors.map(ev => ev.vector));
  
  const rankChange = newRank - state.currentRank;
  const edgeRankChange = newEdgeRank - state.edgeVectorRank;
  
  let message = operation.description;
  if (rankChange !== 0) {
    message += ` Coord rank: ${state.currentRank} → ${newRank}.`;
  }
  if (edgeRankChange !== 0) {
    message += ` Edge rank: ${state.edgeVectorRank} → ${newEdgeRank}.`;
  }
  if (rankChange === 0 && edgeRankChange === 0) {
    message += " Ranks unchanged.";
  }

  // Check if we can reduce further
  const newState = { 
    ...state, 
    vertices: newVertices, 
    edgeVectors: newEdgeVectors,
    currentRank: newRank,
    edgeVectorRank: newEdgeRank,
  };
  const possibleOps = getPossibleOperations(newState);
  const canReduceFurther = possibleOps.some(op => op.resultingRank < newRank);

  return {
    ...newState,
    history: [...state.history, state.vertices],
    message,
    isComplete: !canReduceFurther,
  };
}

/**
 * Undo the last operation.
 */
export function undoOperation(state: ReductionState): ReductionState {
  if (state.history.length === 0) {
    return { ...state, message: "Nothing to undo." };
  }

  const previousVertices = state.history[state.history.length - 1];
  const newHistory = state.history.slice(0, -1);
  const newRank = computeRank(previousVertices.map(v => v.coords));
  const newEdgeVectors = computeEdgeVectors(previousVertices, state.edges);
  const newEdgeRank = computeRank(newEdgeVectors.map(ev => ev.vector));

  return {
    ...state,
    vertices: previousVertices,
    edgeVectors: newEdgeVectors,
    history: newHistory,
    currentRank: newRank,
    edgeVectorRank: newEdgeRank,
    message: "Undid last operation.",
    isComplete: false,
  };
}

/**
 * Reset to initial state.
 */
export function resetReduction(graph: Graph): ReductionState {
  return initializeReduction(graph);
}

/**
 * Auto-solve: greedily apply operations to minimize rank.
 */
export function autoReduce(graph: Graph): {
  finalRank: number;
  steps: string[];
} {
  let state = initializeReduction(graph);
  const steps: string[] = [];
  
  let iterations = 0;
  const maxIterations = 100;

  while (!state.isComplete && iterations < maxIterations) {
    const ops = getPossibleOperations(state);
    const reducingOps = ops.filter(op => op.resultingRank < state.currentRank);
    
    if (reducingOps.length === 0) break;
    
    const bestOp = reducingOps[0];
    state = performOperation(state, bestOp);
    steps.push(`${bestOp.description} → rank ${state.currentRank}`);
    iterations++;
  }

  return {
    finalRank: state.currentRank,
    steps,
  };
}

/**
 * Get the coordinate matrix as a 2D array for display.
 */
export function getCoordinateMatrix(state: ReductionState): {
  matrix: number[][];
  rowLabels: string[];
  colLabels: string[];
} {
  return {
    matrix: state.vertices.map(v => v.coords),
    rowLabels: state.vertices.map(v => v.label),
    colLabels: Array.from({ length: state.numDimensions }, (_, i) => `D${i + 1}`),
  };
}

/**
 * Identify which columns are "active" (have non-zero entries).
 */
export function getActiveColumns(state: ReductionState): number[] {
  const active: number[] = [];
  for (let col = 0; col < state.numDimensions; col++) {
    const hasNonZero = state.vertices.some(v => Math.abs(v.coords[col]) > 1e-10);
    if (hasNonZero) {
      active.push(col);
    }
  }
  return active;
}

// ============================================================================
// FOLDING OPERATIONS - Geometrically valid transformations
// ============================================================================

/**
 * Normalize a vector to unit length.
 */
function normalize(v: number[]): number[] {
  const len = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
  if (len < 1e-10) return v;
  return v.map(x => x / len);
}

/**
 * Scale a vector to a target length.
 */
function scaleToLength(v: number[], targetLength: number): number[] {
  const len = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
  if (len < 1e-10) return v;
  const scale = targetLength / len;
  return v.map(x => x * scale);
}

/**
 * Get dimension-reducing motions for flexible vertices.
 * 
 * A vertex with DOF > 0 can move while preserving edge lengths.
 * We look for motions that reduce the affine dimension (edge vector rank).
 */
export function getDimensionReducingMotions(state: ReductionState): DimensionReducingMotion[] {
  const motions: DimensionReducingMotion[] = [];
  
  // Only flexible vertices can enable dimension reduction
  const flexibleVertices = state.vertexDOFs.filter(v => v.isFlexible);
  
  if (flexibleVertices.length === 0) {
    return motions;
  }
  
  // Build original lengths map
  const originalLengths = new Map<string, number>();
  for (const e of state.edgeVectors) {
    originalLengths.set(e.id, e.length);
  }
  
  // For each flexible vertex, try to find a position that reduces dimension
  for (const flexVertex of flexibleVertices) {
    const vertex = state.vertices.find(v => v.id === flexVertex.id);
    if (!vertex) continue;
    
    // Get edges connected to this vertex
    const connectedEdges = state.edges.filter(
      e => e.source === flexVertex.id || e.target === flexVertex.id
    );
    
    // For a vertex with k connections in d dimensions:
    // It can move on the intersection of k spheres
    // If k < d, there's a (d-k)-dimensional subspace of valid positions
    
    // Strategy: Try to find a position that makes this vertex's coordinates
    // linearly dependent on the others (reduces affine span)
    
    // For single-connection vertices (like end of a path):
    // We can swing the vertex to align with other vertices
    if (connectedEdges.length === 1) {
      const edge = connectedEdges[0];
      const neighborId = edge.source === flexVertex.id ? edge.target : edge.source;
      const neighbor = state.vertices.find(v => v.id === neighborId);
      
      if (neighbor) {
        // Find other vertices to align with
        for (const otherVertex of state.vertices) {
          if (otherVertex.id === flexVertex.id || otherVertex.id === neighborId) continue;
          
          // Try to place flexVertex on the line from neighbor toward otherVertex
          const neighborToOther = otherVertex.coords.map((c, i) => c - neighbor.coords[i]);
          const targetLen = state.edgeVectors.find(
            e => (e.source === flexVertex.id && e.target === neighborId) ||
                 (e.target === flexVertex.id && e.source === neighborId)
          )?.length ?? 1;
          
          // New position: neighbor + targetLen * normalized(neighborToOther)
          const norm = Math.sqrt(neighborToOther.reduce((s, x) => s + x * x, 0));
          if (norm < 1e-10) continue;
          
          const newCoords = neighbor.coords.map((c, i) => 
            c + (neighborToOther[i] / norm) * targetLen
          );
          
          // Test this new position
          const testVertices = state.vertices.map(v => 
            v.id === flexVertex.id ? { ...v, coords: newCoords } : v
          );
          
          // Check all edge lengths preserved
          const lengthCheck = checkAllEdgeLengthsInternal(testVertices, state.edges, originalLengths);
          
          if (lengthCheck.preserved) {
            // Compute new dimension
            const testEdgeVectors = computeEdgeVectors(testVertices, state.edges);
            const newRank = computeRank(testEdgeVectors.map(e => e.vector));
            
            if (newRank < state.edgeVectorRank) {
              motions.push({
                vertexId: flexVertex.id,
                vertexLabel: flexVertex.label,
                dof: flexVertex.dof,
                description: `Move ${flexVertex.label} toward ${otherVertex.label} line`,
                targetDimension: newRank,
                preservesLengths: true,
              });
            }
          }
        }
      }
    }
    
    // For vertices with 2 connections:
    // They can move on a circle; try positions that align with existing structure
    if (connectedEdges.length === 2) {
      // Find the two neighbors
      const neighbor1Id = connectedEdges[0].source === flexVertex.id 
        ? connectedEdges[0].target : connectedEdges[0].source;
      const neighbor2Id = connectedEdges[1].source === flexVertex.id 
        ? connectedEdges[1].target : connectedEdges[1].source;
      
      const neighbor1 = state.vertices.find(v => v.id === neighbor1Id);
      const neighbor2 = state.vertices.find(v => v.id === neighbor2Id);
      
      if (neighbor1 && neighbor2) {
        // Try to place vertex in the plane of neighbors
        // This is a simplification - in reality we'd need proper circle intersection
        
        // Check if moving this vertex to be collinear with neighbors helps
        const n1ToN2 = neighbor2.coords.map((c, i) => c - neighbor1.coords[i]);
        const norm = Math.sqrt(n1ToN2.reduce((s, x) => s + x * x, 0));
        
        if (norm > 1e-10) {
          // Try collinear position: extend from neighbor1 toward neighbor2
          const edge1 = state.edgeVectors.find(
            e => (e.source === flexVertex.id && e.target === neighbor1Id) ||
                 (e.target === flexVertex.id && e.source === neighbor1Id)
          );
          
          if (edge1) {
            const collinearCoords = neighbor1.coords.map((c, i) => 
              c + (n1ToN2[i] / norm) * edge1.length
            );
            
            const testVertices = state.vertices.map(v => 
              v.id === flexVertex.id ? { ...v, coords: collinearCoords } : v
            );
            
            const lengthCheck = checkAllEdgeLengthsInternal(testVertices, state.edges, originalLengths);
            
            if (lengthCheck.preserved) {
              const testEdgeVectors = computeEdgeVectors(testVertices, state.edges);
              const newRank = computeRank(testEdgeVectors.map(e => e.vector));
              
              if (newRank < state.edgeVectorRank) {
                motions.push({
                  vertexId: flexVertex.id,
                  vertexLabel: flexVertex.label,
                  dof: flexVertex.dof,
                  description: `Align ${flexVertex.label} with ${neighbor1.label}-${neighbor2.label}`,
                  targetDimension: newRank,
                  preservesLengths: true,
                });
              }
            }
          }
        }
      }
    }
  }
  
  // Sort by target dimension (lower is better)
  motions.sort((a, b) => a.targetDimension - b.targetDimension);
  
  // Remove duplicates
  const seen = new Set<string>();
  return motions.filter(m => {
    const key = `${m.vertexId}-${m.targetDimension}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Internal helper to check edge lengths (same as checkAllEdgeLengths but available internally)
 */
function checkAllEdgeLengthsInternal(
  vertices: VertexCoordinates[],
  edges: EdgeConstraint[],
  originalLengths: Map<string, number>,
  tolerance: number = 0.01
): { preserved: boolean; violations: string[] } {
  const violations: string[] = [];
  
  for (const edge of edges) {
    const source = vertices.find(v => v.id === edge.source);
    const target = vertices.find(v => v.id === edge.target);
    
    if (!source || !target) continue;
    
    const diff = target.coords.map((c, i) => c - source.coords[i]);
    const newLength = Math.sqrt(diff.reduce((sum, x) => sum + x * x, 0));
    const originalLength = originalLengths.get(edge.id) ?? newLength;
    
    if (Math.abs(newLength - originalLength) > tolerance) {
      violations.push(`${edge.id}: ${originalLength.toFixed(2)} → ${newLength.toFixed(2)}`);
    }
  }
  
  return { preserved: violations.length === 0, violations };
}

/**
 * Get valid folding operations for the current state.
 * 
 * A folding operation aligns one edge vector with another,
 * reducing the edge rank while preserving ALL edge lengths.
 * 
 * IMPORTANT: For graphs with cycles (like K₂,₂,₂), most naive folds
 * will violate other edge constraints. We must check all edges.
 */
export function getFoldingOperations(state: ReductionState): FoldingOperation[] {
  const operations: FoldingOperation[] = [];
  const edgeVectors = state.edgeVectors;

  if (edgeVectors.length < 2) return operations;

  // Build a map of original edge lengths for validation
  const originalLengths = new Map<string, number>();
  for (const e of state.edgeVectors) {
    originalLengths.set(e.id, e.length);
  }

  // For each pair of edges, check if we can align one to the other
  for (let i = 0; i < edgeVectors.length; i++) {
    for (let j = 0; j < edgeVectors.length; j++) {
      if (i === j) continue;

      const e1 = edgeVectors[i];
      const e2 = edgeVectors[j];

      // Can only align edges that share a vertex
      // e2's source must be e1's target, or e2's target must be e1's source
      const canAlign = e2.source === e1.target || e2.target === e1.source ||
                       e2.source === e1.source || e2.target === e1.target;

      if (!canAlign) continue;

      // Simulate alignment: e2 direction becomes parallel to e1
      const alignedE2 = scaleToLength([...e1.vector], e2.length);
      // Also consider anti-parallel (folding back)
      const antiAlignedE2 = alignedE2.map(x => -x);

      // Compute what the new coordinates would be
      const newCoords = applyEdgeAlignment(state, j, alignedE2);
      
      // CRITICAL: Check if ALL edge lengths are preserved
      const lengthCheck = checkAllEdgeLengths(newCoords, state.edges, originalLengths);
      
      if (lengthCheck.preserved) {
        // Compute resulting edge matrix rank
        const newEdgeVectors = computeEdgeVectors(newCoords, state.edges);
        const newEdgeRank = computeRank(newEdgeVectors.map(e => e.vector));
        const newCoordRank = computeRank(newCoords.map(v => v.coords));

        // Only add if it reduces edge rank
        if (newEdgeRank < state.edgeVectorRank) {
          operations.push({
            type: "align_edge",
            edgeId: e2.id,
            targetEdgeId: e1.id,
            description: `Fold ${e2.id} to align with ${e1.id}`,
            resultingCoordRank: newCoordRank,
            resultingEdgeRank: newEdgeRank,
            preservesLengths: true,
          });
        }
      }

      // Check anti-aligned version too
      const antiCoords = applyEdgeAlignment(state, j, antiAlignedE2);
      const antiLengthCheck = checkAllEdgeLengths(antiCoords, state.edges, originalLengths);
      
      if (antiLengthCheck.preserved) {
        const antiEdgeVectors = computeEdgeVectors(antiCoords, state.edges);
        const antiEdgeRank = computeRank(antiEdgeVectors.map(e => e.vector));
        const antiCoordRank = computeRank(antiCoords.map(v => v.coords));

        if (antiEdgeRank < state.edgeVectorRank) {
          operations.push({
            type: "align_edge",
            edgeId: e2.id,
            targetEdgeId: e1.id,
            description: `Fold ${e2.id} back along ${e1.id}`,
            resultingCoordRank: antiCoordRank,
            resultingEdgeRank: antiEdgeRank,
            preservesLengths: true,
          });
        }
      }
    }
  }

  // Also include hinge-based folding operations
  const hingeOps = getHingeFoldingOperations(state);
  operations.push(...hingeOps);

  // Sort by resulting edge rank (lower is better)
  operations.sort((a, b) => {
    if (a.resultingEdgeRank !== b.resultingEdgeRank) {
      return a.resultingEdgeRank - b.resultingEdgeRank;
    }
    return a.resultingCoordRank - b.resultingCoordRank;
  });

  // Remove duplicates
  const seen = new Set<string>();
  return operations.filter(op => {
    const key = `${op.type}-${op.description}-${op.resultingEdgeRank}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Apply an edge alignment by updating vertex coordinates.
 * When we change an edge vector, we need to update the target vertex position.
 */
function applyEdgeAlignment(
  state: ReductionState,
  edgeIndex: number,
  newEdgeVector: number[]
): VertexCoordinates[] {
  const newVertices = state.vertices.map(v => ({ ...v, coords: [...v.coords] }));
  const edge = state.edgeVectors[edgeIndex];
  
  // Find source and target vertices
  const sourceVertex = newVertices.find(v => v.id === edge.source);
  const targetVertex = newVertices.find(v => v.id === edge.target);
  
  if (!sourceVertex || !targetVertex) return newVertices;
  
  // New target position = source position + new edge vector
  targetVertex.coords = sourceVertex.coords.map((c, i) => c + newEdgeVector[i]);
  
  return newVertices;
}

/**
 * Check if all edge lengths are preserved after a coordinate change.
 * This is crucial for graphs with cycles (like K₂,₂,₂) where moving one
 * vertex affects multiple edges.
 */
function checkAllEdgeLengths(
  newVertices: VertexCoordinates[],
  edges: EdgeConstraint[],
  originalLengths: Map<string, number>,
  tolerance: number = 0.01
): { preserved: boolean; violations: string[] } {
  const violations: string[] = [];
  
  for (const edge of edges) {
    const source = newVertices.find(v => v.id === edge.source);
    const target = newVertices.find(v => v.id === edge.target);
    
    if (!source || !target) continue;
    
    // Compute new edge length
    const diff = target.coords.map((c, i) => c - source.coords[i]);
    const newLength = Math.sqrt(diff.reduce((sum, x) => sum + x * x, 0));
    const originalLength = originalLengths.get(edge.id) ?? newLength;
    
    if (Math.abs(newLength - originalLength) > tolerance) {
      violations.push(`${edge.id}: ${originalLength.toFixed(2)} → ${newLength.toFixed(2)}`);
    }
  }
  
  return { preserved: violations.length === 0, violations };
}

// ============================================================================
// HIERARCHICAL RIGID SUBSTRUCTURE ANALYSIS
// ============================================================================

/**
 * Check if a set of vertices forms a clique (complete subgraph).
 */
function isClique(vertices: string[], edges: EdgeConstraint[]): boolean {
  const edgeSet = new Set(edges.map(e => `${e.source}-${e.target}`));
  
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      const v1 = vertices[i];
      const v2 = vertices[j];
      // Check both directions
      if (!edgeSet.has(`${v1}-${v2}`) && !edgeSet.has(`${v2}-${v1}`)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Find all maximal cliques in the graph using Bron-Kerbosch algorithm.
 * Returns cliques of size >= 3 (triangles and larger).
 */
export function findMaximalCliques(state: ReductionState): RigidClique[] {
  const vertices = state.vertices.map(v => v.id);
  const edges = state.edges;
  
  // Build adjacency list
  const neighbors = new Map<string, Set<string>>();
  for (const v of vertices) {
    neighbors.set(v, new Set());
  }
  for (const e of edges) {
    neighbors.get(e.source)?.add(e.target);
    neighbors.get(e.target)?.add(e.source);
  }
  
  const cliques: string[][] = [];
  
  // Bron-Kerbosch with pivot
  function bronKerbosch(R: Set<string>, P: Set<string>, X: Set<string>) {
    if (P.size === 0 && X.size === 0) {
      if (R.size >= 3) {
        cliques.push([...R]);
      }
      return;
    }
    
    // Choose pivot (vertex with most neighbors in P)
    const PX = new Set([...P, ...X]);
    let pivot = "";
    let maxNeighbors = -1;
    for (const v of PX) {
      const n = neighbors.get(v) ?? new Set();
      const count = [...P].filter(p => n.has(p)).length;
      if (count > maxNeighbors) {
        maxNeighbors = count;
        pivot = v;
      }
    }
    
    const pivotNeighbors = neighbors.get(pivot) ?? new Set();
    const candidates = [...P].filter(v => !pivotNeighbors.has(v));
    
    for (const v of candidates) {
      const vNeighbors = neighbors.get(v) ?? new Set();
      bronKerbosch(
        new Set([...R, v]),
        new Set([...P].filter(p => vNeighbors.has(p))),
        new Set([...X].filter(x => vNeighbors.has(x)))
      );
      P.delete(v);
      X.add(v);
    }
  }
  
  bronKerbosch(new Set(), new Set(vertices), new Set());
  
  // Convert to RigidClique objects
  return cliques.map(c => ({
    vertices: c.sort(),
    dimension: c.length - 1,  // K_n is rigid in (n-1) dimensions
  }));
}

/**
 * Find hinges between cliques (shared edges).
 */
export function findHinges(cliques: RigidClique[], edges: EdgeConstraint[]): Hinge[] {
  const hinges: Hinge[] = [];
  const edgeSet = new Set(edges.map(e => 
    [e.source, e.target].sort().join("-")
  ));
  
  for (let i = 0; i < cliques.length; i++) {
    for (let j = i + 1; j < cliques.length; j++) {
      const cA = cliques[i];
      const cB = cliques[j];
      
      // Find shared vertices
      const shared = cA.vertices.filter(v => cB.vertices.includes(v));
      
      // A hinge requires at least 2 shared vertices (an edge)
      if (shared.length >= 2) {
        // Check if the shared vertices form an edge
        const edgeKey = shared.slice(0, 2).sort().join("-");
        if (edgeSet.has(edgeKey)) {
          hinges.push({
            id: `hinge-${i}-${j}`,
            axisVertices: shared.slice(0, 2),
            cliqueA: cA,
            cliqueB: cB,
            axisDimension: shared.length - 1,  // Edge = 1D axis
          });
        }
      }
    }
  }
  
  return hinges;
}

/**
 * Rotate a point around an axis defined by two points.
 * Uses Rodrigues' rotation formula.
 */
function rotateAroundAxis(
  point: number[],
  axisPoint1: number[],
  axisPoint2: number[],
  angle: number
): number[] {
  // Translate to origin (axisPoint1)
  const p = point.map((c, i) => c - axisPoint1[i]);
  
  // Axis direction (normalized)
  const axis = axisPoint2.map((c, i) => c - axisPoint1[i]);
  const axisLen = Math.sqrt(axis.reduce((sum, x) => sum + x * x, 0));
  if (axisLen < 1e-10) return point;
  const k = axis.map(x => x / axisLen);
  
  // Rodrigues' formula: v_rot = v*cos(θ) + (k×v)*sin(θ) + k*(k·v)*(1-cos(θ))
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  
  // Cross product k × p
  const cross = [
    k[1] * (p[2] ?? 0) - (k[2] ?? 0) * (p[1] ?? 0),
    (k[2] ?? 0) * p[0] - k[0] * (p[2] ?? 0),
    k[0] * (p[1] ?? 0) - k[1] * p[0],
  ];
  
  // Dot product k · p
  const dot = k.reduce((sum, ki, i) => sum + ki * (p[i] ?? 0), 0);
  
  // Apply Rodrigues' formula
  const rotated = p.map((pi, i) => {
    const crossi = cross[i] ?? 0;
    const ki = k[i] ?? 0;
    return pi * cosA + crossi * sinA + ki * dot * (1 - cosA);
  });
  
  // Translate back
  return rotated.map((c, i) => c + axisPoint1[i]);
}

/**
 * Apply a hinge fold by rotating one clique around the shared edge.
 */
function applyHingeFold(
  state: ReductionState,
  hinge: Hinge,
  angle: number,
  rotateCliqueB: boolean = true
): VertexCoordinates[] {
  const newVertices = state.vertices.map(v => ({ ...v, coords: [...v.coords] }));
  
  // Get axis points
  const axis1 = newVertices.find(v => v.id === hinge.axisVertices[0]);
  const axis2 = newVertices.find(v => v.id === hinge.axisVertices[1]);
  
  if (!axis1 || !axis2) return newVertices;
  
  // Determine which vertices to rotate
  const cliqueToRotate = rotateCliqueB ? hinge.cliqueB : hinge.cliqueA;
  const verticesToRotate = cliqueToRotate.vertices.filter(
    v => !hinge.axisVertices.includes(v)
  );
  
  // Rotate each vertex
  for (const vid of verticesToRotate) {
    const vertex = newVertices.find(v => v.id === vid);
    if (vertex) {
      vertex.coords = rotateAroundAxis(
        vertex.coords,
        axis1.coords,
        axis2.coords,
        angle
      );
    }
  }
  
  return newVertices;
}

/**
 * Check if a hinge fold is valid (vertices being moved don't have external constraints).
 * 
 * A vertex can only be rotated around a hinge if ALL its neighbors are either:
 * 1. On the hinge axis (distance preserved by rotation around axis)
 * 2. Also being rotated (same clique, not on axis)
 * 
 * If a vertex has edges to vertices outside these sets, the fold is INVALID.
 */
function isHingeFoldValid(
  hinge: Hinge,
  edges: EdgeConstraint[],
  rotateCliqueB: boolean = true
): boolean {
  const cliqueToRotate = rotateCliqueB ? hinge.cliqueB : hinge.cliqueA;
  const axisSet = new Set(hinge.axisVertices);
  const movingVertices = cliqueToRotate.vertices.filter(v => !axisSet.has(v));
  const movingSet = new Set(movingVertices);
  
  // Build adjacency for quick lookup
  const neighbors = new Map<string, Set<string>>();
  for (const e of edges) {
    if (!neighbors.has(e.source)) neighbors.set(e.source, new Set());
    if (!neighbors.has(e.target)) neighbors.set(e.target, new Set());
    neighbors.get(e.source)!.add(e.target);
    neighbors.get(e.target)!.add(e.source);
  }
  
  // Check each moving vertex
  for (const v of movingVertices) {
    const vNeighbors = neighbors.get(v) ?? new Set();
    for (const n of vNeighbors) {
      // Neighbor must be on axis OR also moving
      if (!axisSet.has(n) && !movingSet.has(n)) {
        // This vertex has an edge to something that won't move with it
        // and isn't on the axis - the fold would change this edge length
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Get hinge-based folding operations.
 * These rotate one rigid plate around a shared edge axis.
 */
export function getHingeFoldingOperations(state: ReductionState): FoldingOperation[] {
  const operations: FoldingOperation[] = [];
  
  const cliques = findMaximalCliques(state);
  if (cliques.length < 2) return operations;
  
  const hinges = findHinges(cliques, state.edges);
  if (hinges.length === 0) return operations;
  
  // Build original lengths map
  const originalLengths = new Map<string, number>();
  for (const e of state.edgeVectors) {
    originalLengths.set(e.id, e.length);
  }
  
  // Try different fold angles for each hinge
  const testAngles = [
    Math.PI / 6,   // 30°
    Math.PI / 4,   // 45°
    Math.PI / 3,   // 60°
    Math.PI / 2,   // 90°
    2 * Math.PI / 3, // 120°
    Math.PI,       // 180° (collapse)
  ];
  
  for (const hinge of hinges) {
    // CRITICAL: Check if this hinge fold is even valid
    // (vertices being moved don't have external constraints)
    if (!isHingeFoldValid(hinge, state.edges, true)) {
      continue; // Skip this hinge - moving vertices have external edges
    }
    
    for (const angle of testAngles) {
      // Try folding clique B
      const newVertices = applyHingeFold(state, hinge, angle, true);
      const lengthCheck = checkAllEdgeLengths(newVertices, state.edges, originalLengths);
      
      if (lengthCheck.preserved) {
        const newEdgeVectors = computeEdgeVectors(newVertices, state.edges);
        const newEdgeRank = computeRank(newEdgeVectors.map(e => e.vector));
        const newCoordRank = computeRank(newVertices.map(v => v.coords));
        
        if (newEdgeRank < state.edgeVectorRank) {
          const angleDeg = Math.round(angle * 180 / Math.PI);
          const movingVerts = hinge.cliqueB.vertices.filter(
            v => !hinge.axisVertices.includes(v)
          );
          
          operations.push({
            type: "hinge_fold",
            hinge: {
              axisVertices: hinge.axisVertices as [string, string],
              movingClique: hinge.cliqueB.vertices,
              fixedClique: hinge.cliqueA.vertices,
            },
            description: `Fold at hinge [${hinge.axisVertices.join("-")}] by ${angleDeg}°`,
            resultingCoordRank: newCoordRank,
            resultingEdgeRank: newEdgeRank,
            preservesLengths: true,
          });
        }
      }
      
      // Also try negative angle (fold the other way)
      const newVerticesNeg = applyHingeFold(state, hinge, -angle, true);
      const lengthCheckNeg = checkAllEdgeLengths(newVerticesNeg, state.edges, originalLengths);
      
      if (lengthCheckNeg.preserved) {
        const newEdgeVectorsNeg = computeEdgeVectors(newVerticesNeg, state.edges);
        const newEdgeRankNeg = computeRank(newEdgeVectorsNeg.map(e => e.vector));
        const newCoordRankNeg = computeRank(newVerticesNeg.map(v => v.coords));
        
        if (newEdgeRankNeg < state.edgeVectorRank) {
          const angleDeg = Math.round(angle * 180 / Math.PI);
          
          operations.push({
            type: "hinge_fold",
            hinge: {
              axisVertices: hinge.axisVertices as [string, string],
              movingClique: hinge.cliqueB.vertices,
              fixedClique: hinge.cliqueA.vertices,
            },
            description: `Fold at hinge [${hinge.axisVertices.join("-")}] by -${angleDeg}°`,
            resultingCoordRank: newCoordRankNeg,
            resultingEdgeRank: newEdgeRankNeg,
            preservesLengths: true,
          });
        }
      }
    }
  }
  
  // Remove duplicates and sort
  const seen = new Set<string>();
  const unique = operations.filter(op => {
    const key = `${op.description}-${op.resultingEdgeRank}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  unique.sort((a, b) => a.resultingEdgeRank - b.resultingEdgeRank);
  
  return unique;
}

/**
 * Perform a folding operation (either edge alignment or hinge fold).
 */
export function performFolding(
  state: ReductionState,
  operation: FoldingOperation
): ReductionState {
  let newVertices: VertexCoordinates[];
  
  if (operation.type === "hinge_fold" && operation.hinge) {
    // Handle hinge-based folding
    const hinge = operation.hinge;
    
    // Parse angle from description (e.g., "Fold at hinge [1-2] by 90°")
    const angleMatch = operation.description.match(/by (-?\d+)°/);
    const angleDeg = angleMatch ? parseInt(angleMatch[1]) : 0;
    const angle = (angleDeg * Math.PI) / 180;
    
    // Find the cliques
    const cliques = findMaximalCliques(state);
    const hinges = findHinges(cliques, state.edges);
    
    // Find matching hinge
    const matchingHinge = hinges.find(h => 
      h.axisVertices[0] === hinge.axisVertices[0] && 
      h.axisVertices[1] === hinge.axisVertices[1]
    );
    
    if (!matchingHinge) {
      return { ...state, message: "Invalid hinge folding operation" };
    }
    
    newVertices = applyHingeFold(state, matchingHinge, angle, true);
  } else {
    // Handle edge alignment
    const edgeIndex = state.edgeVectors.findIndex(e => e.id === operation.edgeId);
    const targetEdge = state.edgeVectors.find(e => e.id === operation.targetEdgeId);
    
    if (edgeIndex === -1 || !targetEdge) {
      return { ...state, message: "Invalid folding operation" };
    }
    
    const currentEdge = state.edgeVectors[edgeIndex];
    
    // Compute new edge vector (aligned with target, same length as current)
    let newEdgeVector: number[];
    if (operation.description.includes("back")) {
      // Anti-align
      newEdgeVector = scaleToLength(targetEdge.vector.map(x => -x), currentEdge.length);
    } else {
      // Align
      newEdgeVector = scaleToLength([...targetEdge.vector], currentEdge.length);
    }
    
    newVertices = applyEdgeAlignment(state, edgeIndex, newEdgeVector);
  }
  
  // Recompute edge vectors
  const newEdgeVectors = computeEdgeVectors(newVertices, state.edges);
  
  // Compute new ranks
  const newCoordRank = computeRank(newVertices.map(v => v.coords));
  const newEdgeRank = computeRank(newEdgeVectors.map(e => e.vector));
  
  // Verify edge lengths are preserved
  const lengthsPreserved = newEdgeVectors.every((e, i) => 
    Math.abs(e.length - state.edgeVectors[i].length) < 0.01
  );
  
  const message = lengthsPreserved
    ? `${operation.description}. d_min: ${newEdgeRank}.`
    : `${operation.description}. WARNING: Edge lengths changed!`;
  
  return {
    ...state,
    vertices: newVertices,
    edgeVectors: newEdgeVectors,
    currentRank: newCoordRank,
    edgeVectorRank: newEdgeRank,
    history: [...state.history, state.vertices],
    message,
    isComplete: newEdgeRank === 1 || getFoldingOperations({ ...state, vertices: newVertices, edgeVectors: newEdgeVectors, currentRank: newCoordRank, edgeVectorRank: newEdgeRank }).length === 0,
  };
}
