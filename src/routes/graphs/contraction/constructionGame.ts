/**
 * Construction Game - Build graphs additively to discover d_min
 * 
 * Instead of folding down from max dimension, we build up from nothing.
 * Each operation has a dimension cost, and the maximum cost reached is d_min.
 * 
 * Operations:
 * 1. Add vertex connected to a set of existing vertices
 *    - If the set forms a k-simplex (K_{k+1}), the new vertex requires dimension k+1
 *    - Otherwise, it can exist in the current dimension
 * 
 * 2. Split vertex into edge
 *    - Replace v with (v1, v2) where both inherit v's connections
 *    - This "inflates" a point into an edge
 */

import Graph from "graphology";

export interface ConstructionVertex {
  id: string;
  label: string;
  color: string;
  addedAt: number;  // Step number when added
}

export interface ConstructionEdge {
  source: string;
  target: string;
  addedAt: number;  // Step number when added
}

export interface ConstructionStep {
  type: "add_vertex" | "add_edge" | "split_vertex";
  description: string;
  /** The new vertex ID (for add_vertex) */
  vertexId?: string;
  /** Vertices the new vertex connects to */
  connectsTo?: string[];
  /** The simplex size of connectsTo (if they form a complete subgraph) */
  simplexSize?: number;
  /** Dimension required for this step */
  dimensionRequired: number;
  /** Cumulative max dimension after this step */
  currentDimension: number;
}

export interface ConstructionState {
  vertices: ConstructionVertex[];
  edges: ConstructionEdge[];
  steps: ConstructionStep[];
  currentDimension: number;
  stepNumber: number;
  targetGraph: Graph | null;
  isComplete: boolean;
  message: string;
}

/**
 * Check if a set of vertices forms a complete subgraph (simplex) in the current construction.
 */
function formsCompleteSubgraph(vertexIds: string[], edges: ConstructionEdge[]): boolean {
  if (vertexIds.length <= 1) return true;
  
  const edgeSet = new Set<string>();
  for (const e of edges) {
    edgeSet.add(`${e.source}-${e.target}`);
    edgeSet.add(`${e.target}-${e.source}`);
  }
  
  for (let i = 0; i < vertexIds.length; i++) {
    for (let j = i + 1; j < vertexIds.length; j++) {
      const key = `${vertexIds[i]}-${vertexIds[j]}`;
      if (!edgeSet.has(key)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Find the largest complete subgraph (clique) within a set of vertices.
 */
function findLargestClique(vertexIds: string[], edges: ConstructionEdge[]): string[] {
  if (vertexIds.length === 0) return [];
  if (vertexIds.length === 1) return vertexIds;
  
  // Simple greedy approach: find largest subset that forms a clique
  // For small sets, we can check all subsets
  if (vertexIds.length <= 8) {
    let bestClique: string[] = [];
    
    // Generate all subsets
    const n = vertexIds.length;
    for (let mask = 1; mask < (1 << n); mask++) {
      const subset: string[] = [];
      for (let i = 0; i < n; i++) {
        if (mask & (1 << i)) {
          subset.push(vertexIds[i]);
        }
      }
      if (subset.length > bestClique.length && formsCompleteSubgraph(subset, edges)) {
        bestClique = subset;
      }
    }
    return bestClique;
  }
  
  // For larger sets, just check if the whole set is a clique
  if (formsCompleteSubgraph(vertexIds, edges)) {
    return vertexIds;
  }
  
  // Fallback: return single vertex
  return [vertexIds[0]];
}

/**
 * Initialize an empty construction state.
 */
export function initializeConstruction(targetGraph?: Graph): ConstructionState {
  return {
    vertices: [],
    edges: [],
    steps: [],
    currentDimension: 0,
    stepNumber: 0,
    targetGraph: targetGraph ?? null,
    isComplete: false,
    message: "Start building! Add vertices and edges to construct the graph.",
  };
}

/**
 * Add a vertex connected to a set of existing vertices.
 */
export function addVertex(
  state: ConstructionState,
  vertexId: string,
  label: string,
  color: string,
  connectsTo: string[]
): ConstructionState {
  // Check if vertex already exists
  if (state.vertices.some(v => v.id === vertexId)) {
    return { ...state, message: `Vertex ${vertexId} already exists!` };
  }
  
  const stepNumber = state.stepNumber + 1;
  
  // Add the vertex
  const newVertex: ConstructionVertex = {
    id: vertexId,
    label,
    color,
    addedAt: stepNumber,
  };
  
  // Add edges to connected vertices
  const newEdges: ConstructionEdge[] = [];
  for (const targetId of connectsTo) {
    if (state.vertices.some(v => v.id === targetId)) {
      newEdges.push({
        source: vertexId,
        target: targetId,
        addedAt: stepNumber,
      });
    }
  }
  
  // Add edges
  const allEdges = [...state.edges, ...newEdges];
  
  // Dimension required: connecting to k vertices (in generic position) requires dimension k
  // This is because:
  // - k points in generic position span a (k-1)-dimensional affine subspace
  // - A new point with k distance constraints to those k points generically requires dimension k
  // - The connections do NOT need to form a complete subgraph (simplex)
  
  let dimensionRequired: number;
  if (state.vertices.length === 0) {
    // First vertex - dimension 0 (a point)
    dimensionRequired = 0;
  } else if (connectsTo.length === 0) {
    // Isolated vertex (unusual) - doesn't increase dimension but adds a disjoint component
    dimensionRequired = state.currentDimension;
  } else {
    // Connecting to k vertices requires dimension k (generically)
    dimensionRequired = connectsTo.length;
  }
  
  const newDimension = Math.max(state.currentDimension, dimensionRequired);
  
  const step: ConstructionStep = {
    type: "add_vertex",
    description: connectsTo.length === 0 
      ? `Add isolated vertex ${label}`
      : `Add ${label} → {${connectsTo.map(id => 
          state.vertices.find(v => v.id === id)?.label ?? id
        ).join(", ")}}`,
    vertexId,
    connectsTo,
    simplexSize: connectsTo.length, // Now just the connection count
    dimensionRequired,
    currentDimension: newDimension,
  };
  
  // Check if construction matches target graph
  const isComplete = checkCompletion(state.targetGraph, [...state.vertices, newVertex], allEdges);
  
  const connectionCount = connectsTo.length;
  let message: string;
  if (connectionCount === 0) {
    message = `Added isolated ${label}. Dimension: ${newDimension}.`;
  } else if (dimensionRequired > state.currentDimension) {
    message = `Added ${label} with ${connectionCount} connection(s). Dimension increased to ${newDimension}.`;
  } else {
    message = `Added ${label} with ${connectionCount} connection(s). Dimension stays at ${newDimension}.`;
  }
  
  return {
    ...state,
    vertices: [...state.vertices, newVertex],
    edges: allEdges,
    steps: [...state.steps, step],
    currentDimension: newDimension,
    stepNumber,
    isComplete,
    message,
  };
}

/**
 * Add an edge between two existing vertices.
 */
export function addEdge(
  state: ConstructionState,
  source: string,
  target: string
): ConstructionState {
  // Check vertices exist
  if (!state.vertices.some(v => v.id === source) || 
      !state.vertices.some(v => v.id === target)) {
    return { ...state, message: "Both vertices must exist!" };
  }
  
  // Check edge doesn't already exist
  const exists = state.edges.some(e => 
    (e.source === source && e.target === target) ||
    (e.source === target && e.target === source)
  );
  if (exists) {
    return { ...state, message: "Edge already exists!" };
  }
  
  const stepNumber = state.stepNumber + 1;
  
  const newEdge: ConstructionEdge = {
    source,
    target,
    addedAt: stepNumber,
  };
  
  const sourceLabel = state.vertices.find(v => v.id === source)?.label ?? source;
  const targetLabel = state.vertices.find(v => v.id === target)?.label ?? target;
  
  // Adding an edge doesn't increase dimension (we're just connecting existing points)
  // However, if it completes a higher-dimensional simplex... that's tricky.
  // For now, edge additions don't increase dimension.
  
  const step: ConstructionStep = {
    type: "add_edge",
    description: `Add edge ${sourceLabel}-${targetLabel}`,
    dimensionRequired: state.currentDimension,
    currentDimension: state.currentDimension,
  };
  
  const newEdges = [...state.edges, newEdge];
  const isComplete = checkCompletion(state.targetGraph, state.vertices, newEdges);
  
  return {
    ...state,
    edges: newEdges,
    steps: [...state.steps, step],
    stepNumber,
    isComplete,
    message: `Added edge ${sourceLabel}-${targetLabel}.`,
  };
}

/**
 * Split a vertex into two connected vertices.
 * Both new vertices inherit all connections of the original.
 */
export function splitVertex(
  state: ConstructionState,
  originalId: string,
  newId1: string,
  newId2: string,
  label1: string,
  label2: string,
  color1: string,
  color2: string
): ConstructionState {
  const original = state.vertices.find(v => v.id === originalId);
  if (!original) {
    return { ...state, message: `Vertex ${originalId} not found!` };
  }
  
  const stepNumber = state.stepNumber + 1;
  
  // Find all edges connected to original
  const connectedEdges = state.edges.filter(e => 
    e.source === originalId || e.target === originalId
  );
  
  // Create two new vertices
  const newVertices = state.vertices.filter(v => v.id !== originalId);
  newVertices.push(
    { id: newId1, label: label1, color: color1, addedAt: stepNumber },
    { id: newId2, label: label2, color: color2, addedAt: stepNumber }
  );
  
  // Create new edges: 
  // - Edge between the two new vertices
  // - Each new vertex connects to all neighbors of original
  const newEdges = state.edges.filter(e => 
    e.source !== originalId && e.target !== originalId
  );
  
  // Edge between split vertices
  newEdges.push({ source: newId1, target: newId2, addedAt: stepNumber });
  
  // Duplicate connections for both new vertices
  for (const e of connectedEdges) {
    const neighbor = e.source === originalId ? e.target : e.source;
    newEdges.push({ source: newId1, target: neighbor, addedAt: stepNumber });
    newEdges.push({ source: newId2, target: neighbor, addedAt: stepNumber });
  }
  
  // Splitting can increase dimension by 1 (inflating a point to a line segment)
  const dimensionRequired = state.currentDimension + 1;
  
  const step: ConstructionStep = {
    type: "split_vertex",
    description: `Split ${original.label} into ${label1}-${label2}`,
    dimensionRequired,
    currentDimension: dimensionRequired,
  };
  
  return {
    ...state,
    vertices: newVertices,
    edges: newEdges,
    steps: [...state.steps, step],
    currentDimension: dimensionRequired,
    stepNumber,
    isComplete: false, // Splitting changes the graph structure
    message: `Split ${original.label} into edge ${label1}-${label2}. Dimension: ${dimensionRequired}.`,
  };
}

/**
 * Check if construction matches the target graph.
 */
function checkCompletion(
  targetGraph: Graph | null,
  vertices: ConstructionVertex[],
  edges: ConstructionEdge[]
): boolean {
  if (!targetGraph) return false;
  
  // Check vertex count
  if (vertices.length !== targetGraph.order) return false;
  
  // Check edge count
  if (edges.length !== targetGraph.size) return false;
  
  // Could do more detailed isomorphism check, but this is a start
  return true;
}

/**
 * Undo the last step.
 */
export function undoStep(state: ConstructionState): ConstructionState {
  if (state.steps.length === 0) {
    return { ...state, message: "Nothing to undo!" };
  }
  
  const lastStep = state.steps[state.steps.length - 1];
  const newSteps = state.steps.slice(0, -1);
  
  // Remove elements added in the last step
  const newVertices = state.vertices.filter(v => v.addedAt !== state.stepNumber);
  const newEdges = state.edges.filter(e => e.addedAt !== state.stepNumber);
  
  // Recalculate current dimension from remaining steps
  const newDimension = newSteps.length === 0 
    ? 0 
    : Math.max(...newSteps.map(s => s.currentDimension));
  
  return {
    ...state,
    vertices: newVertices,
    edges: newEdges,
    steps: newSteps,
    currentDimension: newDimension,
    stepNumber: state.stepNumber - 1,
    isComplete: false,
    message: `Undid: ${lastStep.description}`,
  };
}

/**
 * Reset the construction.
 */
export function resetConstruction(state: ConstructionState): ConstructionState {
  return initializeConstruction(state.targetGraph);
}

/**
 * Get suggested next moves to build toward the target graph.
 */
export function getSuggestedMoves(state: ConstructionState): string[] {
  if (!state.targetGraph) return [];
  
  const suggestions: string[] = [];
  const existingVertexIds = new Set(state.vertices.map(v => v.id));
  
  // Suggest adding missing vertices
  state.targetGraph.forEachNode((nodeId) => {
    if (!existingVertexIds.has(nodeId)) {
      const attrs = state.targetGraph!.getNodeAttributes(nodeId);
      suggestions.push(`Add vertex ${attrs.label || nodeId}`);
    }
  });
  
  // Suggest adding missing edges
  if (suggestions.length === 0) {
    const existingEdges = new Set(state.edges.map(e => 
      [e.source, e.target].sort().join("-")
    ));
    
    state.targetGraph.forEachEdge((edge, attrs, source, target) => {
      const key = [source, target].sort().join("-");
      if (!existingEdges.has(key)) {
        suggestions.push(`Add edge ${source}-${target}`);
      }
    });
  }
  
  return suggestions.slice(0, 5);
}
