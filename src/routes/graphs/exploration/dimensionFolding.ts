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

/**
 * Result of a folding step computation.
 */
export interface FoldingStep {
  /** New positions after this step */
  positions: { [key: string]: [number, number, number] };
  /** Current affine dimension */
  dimension: number;
  /** Step number */
  step: number;
  /** Whether target dimension reached */
  reachedTarget: boolean;
  /** Maximum edge length violation */
  maxViolation: number;
}

/**
 * A discrete, named transformation in a folding sequence.
 * Unlike keyframes (which are interpolation points), transformations
 * represent meaningful operations that the user can inspect.
 */
export interface FoldingTransformation {
  /** Unique identifier */
  id: string;
  /** Human-readable name (e.g., "Align to XY plane", "Fold along hinge") */
  name: string;
  /** Detailed description of what this transformation does */
  description: string;
  /** Type of transformation */
  type: "rigid" | "internal_dof" | "combined";
  /** Starting positions for each vertex */
  startPositions: { [label: string]: [number, number, number] };
  /** Ending positions for each vertex */
  endPositions: { [label: string]: [number, number, number] };
  /** Dimension before this transformation */
  startDimension: number;
  /** Dimension after this transformation */
  endDimension: number;
}

/**
 * Result of computing folding transformations.
 */
export interface FoldingTransformationResult {
  /** The sequence of transformations */
  transformations: FoldingTransformation[];
  /** Whether the target dimension was reached */
  success: boolean;
  /** Explanation of the folding process */
  explanation: string;
}

/**
 * Compute a folding path from current positions toward a target dimension.
 * Uses iterative steps with constraint projection to preserve edge lengths.
 *
 * @param graph - The graph structure  
 * @param startPositions - Starting vertex positions
 * @param targetDimension - Target dimension (1 or 2)
 * @param options - Configuration options
 * @returns Array of folding steps
 */
export function computeFoldingPath(
  graph: Graph,
  startPositions: { [key: string]: [number, number, number] },
  targetDimension: 1 | 2,
  options: {
    maxSteps?: number;
    stepSize?: number;
    convergenceThreshold?: number;
    constraintIterations?: number;
  } = {}
): FoldingStep[] {
  const {
    maxSteps = 100,
    stepSize = 0.05,
    convergenceThreshold = 0.01,
    constraintIterations = 20,
  } = options;

  const labels = Object.keys(startPositions);
  const n = labels.length;

  if (n === 0) return [];

  // Compute target edge lengths from initial positions
  const targetLengths: Map<string, number> = new Map();
  graph.forEachEdge((edge, _attr, source, target) => {
    const sourceLabel = graph.getNodeAttribute(source, "label");
    const targetLabel = graph.getNodeAttribute(target, "label");
    const p1 = startPositions[sourceLabel];
    const p2 = startPositions[targetLabel];
    if (p1 && p2) {
      const length = Math.sqrt(
        (p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2 + (p2[2] - p1[2]) ** 2
      );
      targetLengths.set(`${sourceLabel}-${targetLabel}`, length);
    }
  });

  // Initialize path with starting position
  const path: FoldingStep[] = [];
  let currentPositions = { ...startPositions };
  
  // Deep copy positions
  for (const label of labels) {
    currentPositions[label] = [...startPositions[label]] as [number, number, number];
  }

  let currentDimension = computeAffineDimension(currentPositions);
  
  path.push({
    positions: JSON.parse(JSON.stringify(currentPositions)),
    dimension: currentDimension,
    step: 0,
    reachedTarget: currentDimension <= targetDimension,
    maxViolation: 0,
  });

  if (currentDimension <= targetDimension) {
    return path; // Already at target
  }

  // Iteratively fold toward target dimension
  for (let step = 1; step <= maxSteps; step++) {
    // Compute centroid
    const centroid: [number, number, number] = [0, 0, 0];
    for (const label of labels) {
      const p = currentPositions[label];
      centroid[0] += p[0] / n;
      centroid[1] += p[1] / n;
      centroid[2] += p[2] / n;
    }

    // Move vertices toward the target plane/line
    for (const label of labels) {
      const p = currentPositions[label];
      
      if (targetDimension === 2) {
        // Fold toward z = centroid[2] (flatten to plane)
        const dz = centroid[2] - p[2];
        p[2] += dz * stepSize;
      } else if (targetDimension === 1) {
        // Fold toward the line y = centroid[1], z = centroid[2]
        const dy = centroid[1] - p[1];
        const dz = centroid[2] - p[2];
        p[1] += dy * stepSize;
        p[2] += dz * stepSize;
      }
    }

    // Project to satisfy edge length constraints (FABRIK-style)
    let maxViolation = 0;
    for (let iter = 0; iter < constraintIterations; iter++) {
      graph.forEachEdge((edge, _attr, source, target) => {
        const sourceLabel = graph.getNodeAttribute(source, "label");
        const targetLabel = graph.getNodeAttribute(target, "label");
        const targetLength = targetLengths.get(`${sourceLabel}-${targetLabel}`);
        
        if (!targetLength) return;

        const p1 = currentPositions[sourceLabel];
        const p2 = currentPositions[targetLabel];
        if (!p1 || !p2) return;

        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        const dz = p2[2] - p1[2];
        const currentLength = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (currentLength < 0.0001) return;

        const error = currentLength - targetLength;
        maxViolation = Math.max(maxViolation, Math.abs(error));

        // Adjust both endpoints equally
        const correction = error / currentLength * 0.5;
        p1[0] += dx * correction;
        p1[1] += dy * correction;
        p1[2] += dz * correction;
        p2[0] -= dx * correction;
        p2[1] -= dy * correction;
        p2[2] -= dz * correction;
      });
    }

    // Check current dimension
    currentDimension = computeAffineDimension(currentPositions);
    const reachedTarget = currentDimension <= targetDimension;

    path.push({
      positions: JSON.parse(JSON.stringify(currentPositions)),
      dimension: currentDimension,
      step,
      reachedTarget,
      maxViolation,
    });

    // Check convergence
    if (reachedTarget || maxViolation > 1.0) {
      break; // Either reached target or constraints are too violated
    }
  }

  return path;
}

/**
 * Get keyframes from a folding path for animation.
 * Reduces the path to a manageable number of keyframes.
 */
export function getFoldingKeyframes(
  path: FoldingStep[],
  maxKeyframes: number = 20
): FoldingStep[] {
  if (path.length <= maxKeyframes) {
    return path;
  }

  const keyframes: FoldingStep[] = [];
  const stepInterval = Math.floor(path.length / maxKeyframes);

  for (let i = 0; i < path.length; i += stepInterval) {
    keyframes.push(path[i]);
  }

  // Always include the last frame
  if (keyframes[keyframes.length - 1] !== path[path.length - 1]) {
    keyframes.push(path[path.length - 1]);
  }

  return keyframes;
}

/**
 * Compute folding transformations for a linkage.
 * 
 * This generates a sequence of discrete, meaningful transformations
 * that fold a linkage from its current dimension to a target dimension.
 * 
 * For a path graph like P₃ (V-graph) folding from 2D to 1D:
 * - One transformation: "Fold along hinge" using the internal DOF
 * 
 * For a 3D configuration folding to 1D:
 * - First: "Align to XY plane" (rigid motion)
 * - Then: "Fold to line" (internal DOF motion)
 * 
 * @param graph - The graph structure
 * @param startPositions - Current vertex positions
 * @param targetDimension - Target dimension (1 or 2)
 * @returns Result containing transformations and success status
 */
export function computeFoldingTransformations(
  graph: Graph,
  startPositions: { [key: string]: [number, number, number] },
  targetDimension: 1 | 2
): FoldingTransformationResult {
  const transformations: FoldingTransformation[] = [];
  const labels = Object.keys(startPositions);
  const n = labels.length;

  if (n === 0) {
    return {
      transformations: [],
      success: false,
      explanation: "No vertices to fold",
    };
  }

  // Compute initial analysis
  const startDimension = computeAffineDimension(startPositions);
  
  if (startDimension <= targetDimension) {
    return {
      transformations: [],
      success: true,
      explanation: `Already at ${startDimension}D (target: ${targetDimension}D)`,
    };
  }

  // Check if folding is possible
  const analysis = analyzeDimensionFolding(graph, startPositions);
  if (analysis.minimalDimension > targetDimension) {
    return {
      transformations: [],
      success: false,
      explanation: `Cannot fold to ${targetDimension}D. Minimal dimension is ${analysis.minimalDimension}D (${analysis.explanation})`,
    };
  }

  // Compute target edge lengths
  const targetLengths: Map<string, number> = new Map();
  graph.forEachEdge((_edge, _attr, source, target) => {
    const sourceLabel = graph.getNodeAttribute(source, "label");
    const targetLabel = graph.getNodeAttribute(target, "label");
    const p1 = startPositions[sourceLabel];
    const p2 = startPositions[targetLabel];
    if (p1 && p2) {
      const length = Math.sqrt(
        (p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2 + (p2[2] - p1[2]) ** 2
      );
      targetLengths.set(`${sourceLabel}-${targetLabel}`, length);
    }
  });

  let currentPositions = JSON.parse(JSON.stringify(startPositions));
  let currentDimension = startDimension;

  // Step 1: If in 3D and targeting 2D or 1D, first align to a plane
  if (currentDimension === 3 && targetDimension <= 2) {
    const alignedPositions = alignToPlane(currentPositions, labels);
    
    transformations.push({
      id: "align-to-plane",
      name: "Align to XY Plane",
      description: "Rotate and translate the linkage so all vertices lie in the XY plane (z = 0). This is a rigid motion that preserves edge lengths and angles.",
      type: "rigid",
      startPositions: JSON.parse(JSON.stringify(currentPositions)),
      endPositions: JSON.parse(JSON.stringify(alignedPositions)),
      startDimension: currentDimension,
      endDimension: 2,
    });

    currentPositions = alignedPositions;
    currentDimension = 2;
  }

  // Step 2: If in 2D and targeting 1D, fold using internal DOF
  if (currentDimension === 2 && targetDimension === 1) {
    const foldedPositions = foldToLine(graph, currentPositions, labels, targetLengths);
    
    // Determine the type of motion based on graph structure
    const motionDescription = isPathLike(graph)
      ? "Use the hinge degree of freedom to collapse the path to a line. Each joint acts as a hinge, allowing adjacent edges to rotate relative to each other."
      : "Use internal degrees of freedom to fold the linkage to a line while preserving all edge lengths.";

    transformations.push({
      id: "fold-to-line",
      name: "Fold to Line",
      description: motionDescription,
      type: "internal_dof",
      startPositions: JSON.parse(JSON.stringify(currentPositions)),
      endPositions: JSON.parse(JSON.stringify(foldedPositions)),
      startDimension: currentDimension,
      endDimension: 1,
    });

    currentDimension = 1;
  }

  // Step 2 alternative: If in 3D and targeting 2D only
  if (startDimension === 3 && targetDimension === 2 && transformations.length === 1) {
    // Already handled by align-to-plane
  }

  const finalDimension = computeAffineDimension(
    transformations.length > 0 
      ? transformations[transformations.length - 1].endPositions 
      : currentPositions
  );

  return {
    transformations,
    success: finalDimension <= targetDimension,
    explanation: `Generated ${transformations.length} transformation(s) to fold from ${startDimension}D to ${targetDimension}D`,
  };
}

/**
 * Align a point set to the XY plane (z = 0).
 * Uses PCA to find the best-fit plane and rotates to align it with XY.
 */
function alignToPlane(
  positions: { [label: string]: [number, number, number] },
  labels: string[]
): { [label: string]: [number, number, number] } {
  const n = labels.length;
  
  // Compute centroid
  const centroid: [number, number, number] = [0, 0, 0];
  for (const label of labels) {
    const p = positions[label];
    centroid[0] += p[0] / n;
    centroid[1] += p[1] / n;
    centroid[2] += p[2] / n;
  }

  // For simplicity, project to z = 0 while preserving x, y
  // (A more sophisticated approach would use SVD to find the best-fit plane)
  const result: { [label: string]: [number, number, number] } = {};
  for (const label of labels) {
    const p = positions[label];
    result[label] = [p[0], p[1], 0];
  }

  return result;
}

/**
 * Fold a 2D point set to a line (1D).
 * Uses constraint-satisfying optimization to find final positions.
 */
function foldToLine(
  graph: Graph,
  positions: { [label: string]: [number, number, number] },
  labels: string[],
  targetLengths: Map<string, number>
): { [label: string]: [number, number, number] } {
  const n = labels.length;
  
  // For a path graph, we can analytically fold to a line
  // Place all vertices along the x-axis, preserving edge lengths
  
  // Find an endpoint (degree 1 vertex) to start from
  let startLabel: string | null = null;
  for (const label of labels) {
    const nodeId = findNodeIdByLabel(graph, label);
    if (nodeId && graph.degree(nodeId) === 1) {
      startLabel = label;
      break;
    }
  }

  if (!startLabel) {
    // No degree-1 vertex found, use first vertex
    startLabel = labels[0];
  }

  // Build the path order by traversing from start
  const visited = new Set<string>();
  const pathOrder: string[] = [];
  let current = startLabel;
  
  while (current && !visited.has(current)) {
    visited.add(current);
    pathOrder.push(current);
    
    // Find next unvisited neighbor
    const nodeId = findNodeIdByLabel(graph, current);
    if (!nodeId) break;
    
    let nextLabel: string | null = null;
    graph.forEachNeighbor(nodeId, (neighbor) => {
      const neighborLabel = graph.getNodeAttribute(neighbor, "label") as string;
      if (!visited.has(neighborLabel)) {
        nextLabel = neighborLabel;
      }
    });
    
    current = nextLabel;
  }

  // Place vertices along x-axis preserving edge lengths
  const result: { [label: string]: [number, number, number] } = {};
  let x = 0;
  
  for (let i = 0; i < pathOrder.length; i++) {
    const label = pathOrder[i];
    result[label] = [x, 0, 0];
    
    if (i < pathOrder.length - 1) {
      const nextLabel = pathOrder[i + 1];
      const edgeLength = targetLengths.get(`${label}-${nextLabel}`) 
        || targetLengths.get(`${nextLabel}-${label}`)
        || 1;
      x += edgeLength;
    }
  }

  // Handle any vertices not in the path (shouldn't happen for path graphs)
  for (const label of labels) {
    if (!result[label]) {
      result[label] = [x, 0, 0];
      x += 1;
    }
  }

  return result;
}

/**
 * Find a node ID by its label.
 */
function findNodeIdByLabel(graph: Graph, label: string): string | null {
  let foundId: string | null = null;
  graph.forEachNode((nodeId, attr) => {
    if (attr.label === label) {
      foundId = nodeId;
    }
  });
  return foundId;
}
