// dimensionFolding.ts - Dimension folding analysis for linkages
//
// This module implements algorithms to analyze the dimension folding problem:
// Given a linkage in ℝᵈ, find the minimal dimension ℝᵏ (k ≤ d) into which
// it can be continuously deformed while preserving edge lengths.

import Graph from "graphology";
import {
  computeMatrixRank,
  computeNullSpace,
  createRigidityMatrix,
  computeInternalDOF,
  computeTrivialDOF,
} from "./matrixUtils";

/**
 * Result of dimension folding analysis.
 */
export interface DimensionAnalysis {
  /** Current embedding dimension (affine span of vertices) */
  currentDimension: number;
  /** Theoretical minimal dimension the linkage could fold to */
  minimalDimension: number;
  /** Whether the linkage can fold to a lower dimension */
  canFold: boolean;
  /** Number of dimensions that can be "folded away" */
  foldableDimensions: number;
  /** Internal degrees of freedom (flex modes) */
  internalDOF: number;
  /** Whether the linkage is currently in a flat (lower-dimensional) configuration */
  isFlat: boolean;
  /** Explanation of the folding potential */
  explanation: string;
}

/**
 * Compute the affine dimension of a point set.
 * This is the dimension of the smallest affine subspace containing all points.
 *
 * For n points in ℝᵈ:
 * - 1 point: dimension 0 (a point)
 * - 2 points: dimension 1 (a line) unless coincident
 * - 3 points: dimension 2 (a plane) unless collinear
 * - etc.
 *
 * Algorithm: Compute rank of the centered coordinate matrix.
 *
 * @param coordinates - Map of vertex labels to coordinates
 * @returns The affine dimension (0, 1, 2, or 3)
 */
export function computeAffineDimension(
  coordinates: { [key: string]: [number, number, number] }
): number {
  const points = Object.values(coordinates);
  if (points.length === 0) return 0;
  if (points.length === 1) return 0;

  // Center the points (subtract centroid)
  const n = points.length;
  const centroid: [number, number, number] = [0, 0, 0];
  for (const p of points) {
    centroid[0] += p[0] / n;
    centroid[1] += p[1] / n;
    centroid[2] += p[2] / n;
  }

  // Create centered coordinate matrix (n × 3)
  const centered = points.map((p) => [
    p[0] - centroid[0],
    p[1] - centroid[1],
    p[2] - centroid[2],
  ]);

  // Compute rank of the centered matrix
  const rank = computeMatrixRank(centered);

  return Math.min(rank, 3); // Cap at 3 for 3D space
}

/**
 * Compute the theoretical minimal dimension for a graph.
 *
 * The minimal dimension depends on the graph structure:
 * - A single vertex: 0 (can exist at a point)
 * - A single edge: 1 (can exist on a line)
 * - A triangle (K₃): 2 (rigid triangle requires a plane)
 * - A tetrahedron (K₄): 3 (rigid tetrahedron requires 3D space)
 * - A path Pₙ: 1 (can always fold to a line)
 * - A cycle Cₙ (n ≥ 4): 2 (needs a plane to close the cycle)
 *
 * This is related to the graph's rigidity properties.
 * A graph with internal DOF > 0 may be able to fold to lower dimensions.
 *
 * @param graph - The graph structure
 * @param coordinates - Current vertex positions
 * @returns The theoretical minimal embedding dimension
 */
export function computeMinimalDimension(
  graph: Graph,
  coordinates: { [key: string]: [number, number, number] }
): number {
  const n = graph.order; // vertices
  const m = graph.size; // edges

  // Special cases
  if (n === 0) return 0;
  if (n === 1) return 0;
  if (m === 0) return 0; // Disconnected vertices can collapse to a point

  // For a single edge, minimal dimension is 1
  if (n === 2 && m === 1) return 1;

  // Compute rigidity in each dimension
  // Check if rigid in 2D
  const rigid2D = isRigidInDimension(graph, coordinates, 2);
  const rigid3D = isRigidInDimension(graph, coordinates, 3);

  // If not rigid in 3D, might be able to fold
  if (!rigid3D) {
    // Check if it could be rigid in 2D
    if (rigid2D) {
      return 2; // Can fold to 2D but not lower
    }

    // Check if it's a path-like structure (can fold to 1D)
    if (isPathLike(graph)) {
      return 1;
    }

    // Has flexibility - check based on DOF
    const { matrix } = createRigidityMatrix(graph, coordinates, 3);
    const rank3D = computeMatrixRank(matrix);
    const internalDOF = computeInternalDOF(rank3D, n, 3);

    // More DOF generally means more folding potential
    // This is a heuristic - proper analysis requires configuration space analysis
    if (internalDOF >= 2) {
      return 1; // Likely can fold to a line
    } else if (internalDOF >= 1) {
      return 2; // Likely can fold to a plane
    }
  }

  // Rigid in 3D - check if rigid in 2D
  if (rigid2D) {
    return 2; // Minimally 2D
  }

  return 3; // Needs full 3D
}

/**
 * Check if a graph is rigid in a given dimension.
 *
 * @param graph - The graph
 * @param coordinates - Vertex positions
 * @param dimension - Target dimension (2 or 3)
 * @returns True if infinitesimally rigid in that dimension
 */
function isRigidInDimension(
  graph: Graph,
  coordinates: { [key: string]: [number, number, number] },
  dimension: 2 | 3
): boolean {
  const n = graph.order;
  const { matrix } = createRigidityMatrix(graph, coordinates, dimension);
  const rank = computeMatrixRank(matrix);
  const trivialDOF = computeTrivialDOF(dimension);
  const expectedRank = dimension * n - trivialDOF;

  return rank >= expectedRank;
}

/**
 * Check if a graph is "path-like" (can always fold to 1D).
 * A graph is path-like if it has no cycles and max degree 2.
 */
function isPathLike(graph: Graph): boolean {
  // Check if it's a tree (n vertices, n-1 edges, connected)
  const n = graph.order;
  const m = graph.size;

  // Must have n-1 edges for a tree
  if (m !== n - 1) return false;

  // Check max degree is 2
  let maxDegree = 0;
  graph.forEachNode((node) => {
    const degree = graph.degree(node);
    if (degree > maxDegree) maxDegree = degree;
  });

  return maxDegree <= 2;
}

/**
 * Check if a linkage can fold to a target dimension.
 *
 * @param graph - The graph structure
 * @param coordinates - Current vertex positions
 * @param targetDimension - Desired target dimension (1 or 2)
 * @returns True if folding is theoretically possible
 */
export function canFoldToDimension(
  graph: Graph,
  coordinates: { [key: string]: [number, number, number] },
  targetDimension: 1 | 2
): boolean {
  const minDim = computeMinimalDimension(graph, coordinates);
  return minDim <= targetDimension;
}

/**
 * Perform complete dimension folding analysis.
 *
 * @param graph - The graph structure
 * @param coordinates - Current vertex positions
 * @returns Complete dimension analysis
 */
export function analyzeDimensionFolding(
  graph: Graph,
  coordinates: { [key: string]: [number, number, number] }
): DimensionAnalysis {
  const n = graph.order;
  const m = graph.size;

  // Handle edge cases
  if (n === 0 || Object.keys(coordinates).length === 0) {
    return {
      currentDimension: 0,
      minimalDimension: 0,
      canFold: false,
      foldableDimensions: 0,
      internalDOF: 0,
      isFlat: true,
      explanation: "Empty graph",
    };
  }

  // Compute current affine dimension
  const currentDimension = computeAffineDimension(coordinates);

  // Compute minimal dimension
  const minimalDimension = computeMinimalDimension(graph, coordinates);

  // Compute internal DOF
  const { matrix } = createRigidityMatrix(graph, coordinates, 3);
  const rank = computeMatrixRank(matrix);
  const internalDOF = computeInternalDOF(rank, n, 3);

  // Can fold if minimal < current
  const canFold = minimalDimension < currentDimension;
  const foldableDimensions = Math.max(0, currentDimension - minimalDimension);

  // Check if currently in a flat configuration
  const isFlat = currentDimension < 3;

  // Generate explanation
  let explanation: string;
  if (canFold) {
    if (minimalDimension === 1) {
      explanation = `This linkage can fold from ${currentDimension}D to a line (1D). It has ${internalDOF} internal degree(s) of freedom.`;
    } else if (minimalDimension === 2) {
      explanation = `This linkage can fold from ${currentDimension}D to a plane (2D). It has ${internalDOF} internal degree(s) of freedom.`;
    } else {
      explanation = `This linkage can potentially fold to ${minimalDimension}D.`;
    }
  } else {
    if (internalDOF === 0) {
      explanation = `This linkage is rigid in ${currentDimension}D and cannot fold to a lower dimension.`;
    } else {
      explanation = `This linkage has ${internalDOF} internal DOF but is already at its minimal dimension (${minimalDimension}D).`;
    }
  }

  return {
    currentDimension,
    minimalDimension,
    canFold,
    foldableDimensions,
    internalDOF,
    isFlat,
    explanation,
  };
}

/**
 * Get a display string for the dimension analysis.
 */
export function getDimensionDisplayString(analysis: DimensionAnalysis): string {
  if (analysis.canFold) {
    return `${analysis.currentDimension}D → ${analysis.minimalDimension}D`;
  }
  return `${analysis.currentDimension}D (min)`;
}

/**
 * Compute a folding direction that moves the linkage toward a lower dimension.
 *
 * This finds a direction in configuration space that:
 * 1. Preserves edge lengths (is in the null space of the rigidity matrix)
 * 2. Reduces the affine span of the vertices
 *
 * @param graph - The graph structure
 * @param coordinates - Current vertex positions
 * @param targetDimension - Desired dimension to fold toward
 * @returns Array of vertex displacements, or null if no folding direction exists
 */
export function computeFoldingDirection(
  graph: Graph,
  coordinates: { [key: string]: [number, number, number] },
  targetDimension: 1 | 2
): { [key: string]: [number, number, number] } | null {
  const labels = Object.keys(coordinates);
  const n = labels.length;

  if (n === 0) return null;

  // Get null space of rigidity matrix (valid infinitesimal motions)
  const { matrix } = createRigidityMatrix(graph, coordinates, 3);
  const nullSpace = computeNullSpace(matrix);

  if (nullSpace.length === 0) {
    return null; // Rigid, no folding possible
  }

  // Filter out trivial motions (translations and rotations)
  // For folding, we want motions that change the affine span

  // Compute centroid
  const centroid: [number, number, number] = [0, 0, 0];
  for (const label of labels) {
    const p = coordinates[label];
    centroid[0] += p[0] / n;
    centroid[1] += p[1] / n;
    centroid[2] += p[2] / n;
  }

  // For each null space vector, check if it reduces dimension
  for (const nsVec of nullSpace) {
    // Convert flat vector to per-vertex displacements
    const displacements: { [key: string]: [number, number, number] } = {};
    let reducesZ = true;

    for (let i = 0; i < n; i++) {
      const label = labels[i];
      const dx = nsVec[i * 3] || 0;
      const dy = nsVec[i * 3 + 1] || 0;
      const dz = nsVec[i * 3 + 2] || 0;

      displacements[label] = [dx, dy, dz];

      // Check if this motion moves vertices toward z=0 (for folding to 2D)
      if (targetDimension === 2) {
        const currentZ = coordinates[label][2] - centroid[2];
        // Motion should push vertices toward the centroid z
        if (Math.abs(currentZ) > 0.001 && currentZ * dz > 0) {
          reducesZ = false;
        }
      }
    }

    // For now, return the first non-trivial null space vector
    // A more sophisticated approach would find the optimal folding direction
    const magnitude = Math.sqrt(
      Object.values(displacements).reduce(
        (sum, d) => sum + d[0] * d[0] + d[1] * d[1] + d[2] * d[2],
        0
      )
    );

    if (magnitude > 0.001) {
      // Normalize
      for (const label of labels) {
        displacements[label][0] /= magnitude;
        displacements[label][1] /= magnitude;
        displacements[label][2] /= magnitude;
      }
      return displacements;
    }
  }

  return null;
}
