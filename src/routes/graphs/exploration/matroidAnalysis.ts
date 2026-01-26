// matroidAnalysis.ts - Rigidity matroid analysis for graphs
//
// This module implements algorithms to analyze the rigidity matroid of a graph,
// computing the combinatorial minimal dimension d_min(G), detecting circuits,
// and finding cliques.

import Graph from "graphology";

/**
 * Result of rigidity matroid analysis.
 */
export interface MatroidAnalysis {
  /** Combinatorial minimal dimension d_min(G) */
  d_min: number;
  /** Clique number ω(G) - size of largest complete subgraph */
  cliqueNumber: number;
  /** Whether the graph satisfies Laman conditions for 2D rigidity */
  isLaman: boolean;
  /** Whether the graph is minimally rigid in 2D */
  isMinimallyRigid2D: boolean;
  /** Circuits (minimal dependent edge sets) in the 2D rigidity matroid */
  circuits: string[][];
  /** Largest cliques found (as arrays of node labels) */
  maxCliques: string[][];
  /** Human-readable explanation of the analysis */
  explanation: string;
  /** Lower bound reason */
  lowerBoundReason: string;
}

/**
 * Compute the combinatorial minimal dimension d_min(G).
 * 
 * d_min(G) is the smallest dimension d such that the graph can be generically
 * embedded as a rigid framework in ℝᵈ.
 * 
 * Lower bound: d_min(G) ≥ ω(G) - 1, where ω(G) is the clique number.
 * - K₂ needs 1D, K₃ needs 2D, K₄ needs 3D, etc.
 * 
 * For path graphs (max degree ≤ 2, no cycles): d_min = 1
 * 
 * @param graph - The graph to analyze
 * @returns The combinatorial minimal dimension
 */
export function computeMinimalDimension(graph: Graph): number {
  const n = graph.order;
  const m = graph.size;

  if (n === 0) return 0;
  if (n === 1) return 0;
  if (m === 0) return 0; // Disconnected vertices

  // Find clique number
  const cliqueNumber = findCliqueNumber(graph);
  
  // Lower bound from clique number
  const lowerBound = Math.max(1, cliqueNumber - 1);

  // Check if path-like (can fold to 1D)
  if (isPathLike(graph)) {
    return 1;
  }

  // Check if tree-like but not path (still might fold to 1D with enough flexibility)
  if (isTree(graph)) {
    // Trees with max degree > 2 still have d_min based on local structure
    // A star graph K_{1,n} has d_min = min(n, 3) for n ≥ 3
    const maxDegree = getMaxDegree(graph);
    if (maxDegree <= 2) return 1;
    // Star graphs and similar need higher dimensions
    return Math.min(maxDegree, lowerBound);
  }

  // For general graphs, use the clique-based lower bound
  // This is tight for many cases (complete graphs, etc.)
  return lowerBound;
}

/**
 * Find the clique number ω(G) - the size of the largest complete subgraph.
 * Uses a simple greedy/exhaustive approach for small graphs.
 */
export function findCliqueNumber(graph: Graph): number {
  const nodes = graph.nodes();
  const n = nodes.length;

  if (n === 0) return 0;
  if (n === 1) return 1;

  // For small graphs, check all subsets
  // This is O(2^n) but fine for n ≤ 10 or so
  if (n <= 10) {
    return findCliqueNumberExhaustive(graph, nodes);
  }

  // For larger graphs, use greedy approximation
  return findCliqueNumberGreedy(graph, nodes);
}

/**
 * Exhaustive clique search for small graphs.
 */
function findCliqueNumberExhaustive(graph: Graph, nodes: string[]): number {
  const n = nodes.length;
  let maxCliqueSize = 1;

  // Check all subsets of size k, starting from largest
  for (let k = n; k >= 2; k--) {
    if (k <= maxCliqueSize) break;
    
    // Generate all k-subsets
    const subsets = generateSubsets(nodes, k);
    for (const subset of subsets) {
      if (isClique(graph, subset)) {
        maxCliqueSize = Math.max(maxCliqueSize, k);
        break; // Found a clique of this size, no need to check more
      }
    }
  }

  return maxCliqueSize;
}

/**
 * Greedy clique approximation for larger graphs.
 */
function findCliqueNumberGreedy(graph: Graph, nodes: string[]): number {
  let maxCliqueSize = 1;

  for (const startNode of nodes) {
    // Try to build a clique starting from this node
    const clique = [startNode];
    const candidates = [...graph.neighbors(startNode)];

    while (candidates.length > 0) {
      // Find a candidate that is connected to all current clique members
      let found = false;
      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        if (clique.every(member => graph.hasEdge(member, candidate) || graph.hasEdge(candidate, member))) {
          clique.push(candidate);
          // Update candidates to only include neighbors of new member
          candidates.splice(i, 1);
          found = true;
          break;
        }
      }
      if (!found) break;
    }

    maxCliqueSize = Math.max(maxCliqueSize, clique.length);
  }

  return maxCliqueSize;
}

/**
 * Generate all k-subsets of an array.
 */
function generateSubsets<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (k > arr.length) return [];
  if (k === arr.length) return [arr];

  const result: T[][] = [];
  
  function backtrack(start: number, current: T[]) {
    if (current.length === k) {
      result.push([...current]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }

  backtrack(0, []);
  return result;
}

/**
 * Check if a set of nodes forms a clique (complete subgraph).
 */
function isClique(graph: Graph, nodes: string[]): boolean {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (!graph.hasEdge(nodes[i], nodes[j]) && !graph.hasEdge(nodes[j], nodes[i])) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Find all maximal cliques in the graph.
 * Uses Bron-Kerbosch algorithm for small graphs.
 */
export function findMaxCliques(graph: Graph): string[][] {
  const nodes = graph.nodes();
  const maxCliques: string[][] = [];
  
  // Simple implementation of Bron-Kerbosch
  function bronKerbosch(R: Set<string>, P: Set<string>, X: Set<string>) {
    if (P.size === 0 && X.size === 0) {
      if (R.size > 0) {
        // Convert node IDs to labels
        const labels = Array.from(R).map(id => graph.getNodeAttribute(id, "label") as string);
        maxCliques.push(labels);
      }
      return;
    }

    const PArray = Array.from(P);
    for (const v of PArray) {
      const neighbors = new Set(graph.neighbors(v));
      bronKerbosch(
        new Set([...R, v]),
        new Set([...P].filter(x => neighbors.has(x))),
        new Set([...X].filter(x => neighbors.has(x)))
      );
      P.delete(v);
      X.add(v);
    }
  }

  bronKerbosch(new Set(), new Set(nodes), new Set());

  // Sort by size (largest first) and return only the largest ones
  maxCliques.sort((a, b) => b.length - a.length);
  
  // Filter to only include maximal cliques of the largest size
  if (maxCliques.length > 0) {
    const maxSize = maxCliques[0].length;
    return maxCliques.filter(c => c.length === maxSize);
  }

  return maxCliques;
}

/**
 * Check if the graph satisfies Laman's conditions for 2D minimal rigidity.
 * 
 * A graph is Laman (minimally rigid in 2D) iff:
 * 1. |E| = 2|V| - 3
 * 2. For every non-empty subgraph H: |E(H)| ≤ 2|V(H)| - 3
 */
export function checkLaman(graph: Graph): { isLaman: boolean; isMinimallyRigid: boolean; reason: string } {
  const n = graph.order;
  const m = graph.size;

  if (n < 2) {
    return { isLaman: true, isMinimallyRigid: true, reason: "Trivial graph" };
  }

  const expectedEdges = 2 * n - 3;

  // Check condition 1
  if (m !== expectedEdges) {
    if (m < expectedEdges) {
      return { 
        isLaman: false, 
        isMinimallyRigid: false, 
        reason: `Under-constrained: |E| = ${m}, need ${expectedEdges} for minimal rigidity` 
      };
    } else {
      return { 
        isLaman: false, 
        isMinimallyRigid: false, 
        reason: `Over-constrained: |E| = ${m}, max ${expectedEdges} for Laman` 
      };
    }
  }

  // Check condition 2 for all subgraphs (expensive for large graphs)
  // For small graphs, check all non-trivial subsets of vertices
  const nodes = graph.nodes();
  
  if (n <= 8) {
    // Check all subgraphs
    for (let k = 2; k <= n; k++) {
      const subsets = generateSubsets(nodes, k);
      for (const subset of subsets) {
        const subgraphEdges = countEdgesInSubgraph(graph, subset);
        const maxAllowed = 2 * subset.length - 3;
        if (subgraphEdges > maxAllowed) {
          return { 
            isLaman: false, 
            isMinimallyRigid: false, 
            reason: `Subgraph on ${subset.length} vertices has ${subgraphEdges} edges (max ${maxAllowed})` 
          };
        }
      }
    }
  }

  return { 
    isLaman: true, 
    isMinimallyRigid: true, 
    reason: `Satisfies |E| = 2|V| - 3 = ${expectedEdges}` 
  };
}

/**
 * Count edges within a subgraph induced by a set of vertices.
 */
function countEdgesInSubgraph(graph: Graph, nodes: string[]): number {
  const nodeSet = new Set(nodes);
  let count = 0;
  
  graph.forEachEdge((edge, _attr, source, target) => {
    if (nodeSet.has(source) && nodeSet.has(target)) {
      count++;
    }
  });

  return count;
}

/**
 * Find circuits in the rigidity matroid.
 * A circuit is a minimal dependent set of edges.
 * 
 * In the 2D rigidity matroid, a circuit is a minimal set of edges
 * that violates the Laman condition.
 */
export function findCircuits(graph: Graph, dimension: 2 | 3 = 2): string[][] {
  const circuits: string[][] = [];
  const edges = graph.edges();
  const nodes = graph.nodes();

  if (nodes.length < 3) return circuits;

  // For each subset of vertices, check if the induced subgraph forms a circuit
  // A circuit in 2D: |E(H)| = 2|V(H)| - 2 (one more than allowed)
  
  for (let k = 3; k <= Math.min(nodes.length, 6); k++) {
    const subsets = generateSubsets(nodes, k);
    for (const subset of subsets) {
      const subgraphEdges = getEdgesInSubgraph(graph, subset);
      const threshold = dimension === 2 
        ? 2 * subset.length - 2  // One more than Laman allows
        : 3 * subset.length - 5; // For 3D (approximate)
      
      if (subgraphEdges.length === threshold) {
        // This is a potential circuit - check if it's minimal
        const edgeLabels = subgraphEdges.map(e => {
          const [s, t] = graph.extremities(e);
          const sLabel = graph.getNodeAttribute(s, "label") as string;
          const tLabel = graph.getNodeAttribute(t, "label") as string;
          return `${sLabel}-${tLabel}`;
        });
        
        // Check if any proper subset is also over-constrained
        let isMinimal = true;
        for (const edge of subgraphEdges) {
          const reducedEdges = subgraphEdges.filter(e => e !== edge);
          const [s, t] = graph.extremities(edge);
          // Check if removing this edge still leaves an over-constrained subgraph
          const reducedThreshold = dimension === 2 ? 2 * subset.length - 3 : 3 * subset.length - 6;
          if (reducedEdges.length > reducedThreshold) {
            isMinimal = false;
            break;
          }
        }
        
        if (isMinimal && edgeLabels.length > 0) {
          circuits.push(edgeLabels);
        }
      }
    }
  }

  return circuits;
}

/**
 * Get edges within a subgraph induced by a set of vertices.
 */
function getEdgesInSubgraph(graph: Graph, nodes: string[]): string[] {
  const nodeSet = new Set(nodes);
  const edges: string[] = [];
  
  graph.forEachEdge((edge, _attr, source, target) => {
    if (nodeSet.has(source) && nodeSet.has(target)) {
      edges.push(edge);
    }
  });

  return edges;
}

/**
 * Check if a graph is path-like (can always fold to 1D).
 * A graph is path-like if it's a tree with max degree 2.
 */
function isPathLike(graph: Graph): boolean {
  const n = graph.order;
  const m = graph.size;

  // Must be a tree (n-1 edges, connected)
  if (m !== n - 1) return false;

  // Max degree must be 2
  return getMaxDegree(graph) <= 2;
}

/**
 * Check if a graph is a tree.
 */
function isTree(graph: Graph): boolean {
  const n = graph.order;
  const m = graph.size;
  return m === n - 1 && isConnected(graph);
}

/**
 * Check if a graph is connected.
 */
function isConnected(graph: Graph): boolean {
  const nodes = graph.nodes();
  if (nodes.length === 0) return true;

  const visited = new Set<string>();
  const queue = [nodes[0]];

  while (queue.length > 0) {
    const node = queue.shift()!;
    if (visited.has(node)) continue;
    visited.add(node);
    
    for (const neighbor of graph.neighbors(node)) {
      if (!visited.has(neighbor)) {
        queue.push(neighbor);
      }
    }
  }

  return visited.size === nodes.length;
}

/**
 * Get the maximum degree in the graph.
 */
function getMaxDegree(graph: Graph): number {
  let maxDegree = 0;
  graph.forEachNode((node) => {
    const degree = graph.degree(node);
    if (degree > maxDegree) maxDegree = degree;
  });
  return maxDegree;
}

/**
 * Perform complete rigidity matroid analysis.
 */
export function analyzeRigidityMatroid(graph: Graph): MatroidAnalysis {
  const n = graph.order;
  const m = graph.size;

  if (n === 0) {
    return {
      d_min: 0,
      cliqueNumber: 0,
      isLaman: true,
      isMinimallyRigid2D: true,
      circuits: [],
      maxCliques: [],
      explanation: "Empty graph",
      lowerBoundReason: "No vertices",
    };
  }

  // Compute clique number and minimal dimension
  const cliqueNumber = findCliqueNumber(graph);
  const d_min = computeMinimalDimension(graph);
  const maxCliques = findMaxCliques(graph);

  // Check Laman conditions
  const lamanResult = checkLaman(graph);

  // Find circuits (only for small graphs due to complexity)
  const circuits = n <= 8 ? findCircuits(graph, 2) : [];

  // Generate explanation
  let explanation = "";
  let lowerBoundReason = "";

  if (cliqueNumber >= 2) {
    const cliqueName = cliqueNumber === 2 ? "K₂ (edge)" 
      : cliqueNumber === 3 ? "K₃ (triangle)" 
      : cliqueNumber === 4 ? "K₄ (tetrahedron)"
      : `K${cliqueNumber}`;
    lowerBoundReason = `Contains ${cliqueName} → requires at least ${d_min}D`;
  }

  if (isPathLike(graph)) {
    explanation = `Path graph with ${n} vertices. Can always fold to a line (1D).`;
    lowerBoundReason = "Path graphs have d_min = 1";
  } else if (isTree(graph)) {
    explanation = `Tree graph with ${n} vertices and max degree ${getMaxDegree(graph)}.`;
  } else if (d_min === 2 && lamanResult.isLaman) {
    explanation = `Laman graph: minimally rigid in 2D. ${lamanResult.reason}`;
  } else if (d_min === 2) {
    explanation = `Requires 2D embedding. ${lamanResult.reason}`;
  } else if (d_min === 3) {
    explanation = `Requires 3D embedding. Contains K₄ or equivalent structure.`;
  } else {
    explanation = `Graph with ${n} vertices and ${m} edges. d_min = ${d_min}.`;
  }

  return {
    d_min,
    cliqueNumber,
    isLaman: lamanResult.isLaman,
    isMinimallyRigid2D: lamanResult.isMinimallyRigid,
    circuits,
    maxCliques,
    explanation,
    lowerBoundReason,
  };
}
