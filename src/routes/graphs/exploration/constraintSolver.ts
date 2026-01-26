// constraintSolver.ts - Constraint-preserving motion for linkages
//
// This module implements algorithms for maintaining edge length constraints
// during motion of a graph embedding. The core technique is iterative
// constraint projection (similar to FABRIK or Position Based Dynamics).

import Graph from "graphology";
import * as THREE from "three";

/**
 * Edge constraint representing a fixed distance between two vertices.
 */
export interface EdgeConstraint {
  sourceId: string;
  targetId: string;
  targetLength: number;
}

/**
 * Result of constraint projection containing positions and violation info.
 */
export interface ProjectionResult {
  positions: { [nodeId: string]: THREE.Vector3 };
  violations: EdgeViolation[];
  totalViolation: number;
  converged: boolean;
}

/**
 * Information about a single edge constraint violation.
 */
export interface EdgeViolation {
  edgeId: string;
  sourceId: string;
  targetId: string;
  currentLength: number;
  targetLength: number;
  error: number;
  relativeError: number;
}

/**
 * Compute the current edge lengths from a graph and node positions.
 *
 * @param graph - The graph structure
 * @param positions - Map of node ID to position
 * @returns Map of edge ID to current length
 */
export function computeEdgeLengths(
  graph: Graph,
  positions: { [nodeId: string]: THREE.Vector3 }
): Map<string, number> {
  const lengths = new Map<string, number>();

  graph.forEachEdge((edgeId, _attr, sourceId, targetId) => {
    const sourcePos = positions[sourceId];
    const targetPos = positions[targetId];

    if (sourcePos && targetPos) {
      lengths.set(edgeId, sourcePos.distanceTo(targetPos));
    }
  });

  return lengths;
}

/**
 * Compute edge constraints from initial positions.
 * These constraints capture the initial edge lengths that should be preserved.
 *
 * @param graph - The graph structure
 * @param positions - Initial node positions
 * @returns Array of edge constraints
 */
export function computeEdgeConstraints(
  graph: Graph,
  positions: { [nodeId: string]: THREE.Vector3 }
): EdgeConstraint[] {
  const constraints: EdgeConstraint[] = [];

  graph.forEachEdge((edgeId, _attr, sourceId, targetId) => {
    const sourcePos = positions[sourceId];
    const targetPos = positions[targetId];

    if (sourcePos && targetPos) {
      constraints.push({
        sourceId,
        targetId,
        targetLength: sourcePos.distanceTo(targetPos),
      });
    }
  });

  return constraints;
}

/**
 * Compute constraint violations for the current configuration.
 *
 * @param graph - The graph structure
 * @param positions - Current node positions
 * @param constraints - Edge length constraints
 * @returns Array of violation information
 */
export function computeViolations(
  graph: Graph,
  positions: { [nodeId: string]: THREE.Vector3 },
  constraints: EdgeConstraint[]
): EdgeViolation[] {
  const violations: EdgeViolation[] = [];
  const edges = graph.edges();

  constraints.forEach((constraint, i) => {
    const edgeId = edges[i] || `e${i}`;
    const sourcePos = positions[constraint.sourceId];
    const targetPos = positions[constraint.targetId];

    if (!sourcePos || !targetPos) return;

    const currentLength = sourcePos.distanceTo(targetPos);
    const error = Math.abs(currentLength - constraint.targetLength);
    const relativeError =
      constraint.targetLength > 0 ? error / constraint.targetLength : error;

    violations.push({
      edgeId,
      sourceId: constraint.sourceId,
      targetId: constraint.targetId,
      currentLength,
      targetLength: constraint.targetLength,
      error,
      relativeError,
    });
  });

  return violations;
}

/**
 * Project positions to satisfy edge length constraints using iterative relaxation.
 *
 * This implements a FABRIK-style constraint solver:
 * 1. For each edge, compute the correction needed to match target length
 * 2. Apply half the correction to each endpoint (if both are free)
 * 3. Repeat for specified iterations or until convergence
 *
 * For linkage kinematics, some vertices may be "pinned" (fixed in space).
 * The correction is applied only to free vertices.
 *
 * @param positions - Current node positions (will be cloned, not mutated)
 * @param constraints - Edge length constraints
 * @param options - Solver options
 * @returns Projection result with new positions and violation info
 */
export function projectToConstraints(
  positions: { [nodeId: string]: THREE.Vector3 },
  constraints: EdgeConstraint[],
  options: {
    iterations?: number;
    tolerance?: number;
    pinnedNodes?: Set<string>;
    relaxationFactor?: number;
  } = {}
): ProjectionResult {
  const {
    iterations = 10,
    tolerance = 0.001,
    pinnedNodes = new Set<string>(),
    relaxationFactor = 0.5,
  } = options;

  // Clone positions to avoid mutation
  const newPositions: { [nodeId: string]: THREE.Vector3 } = {};
  for (const [nodeId, pos] of Object.entries(positions)) {
    newPositions[nodeId] = pos.clone();
  }

  let converged = false;
  let totalViolation = Infinity;

  for (let iter = 0; iter < iterations; iter++) {
    totalViolation = 0;

    for (const constraint of constraints) {
      const sourcePos = newPositions[constraint.sourceId];
      const targetPos = newPositions[constraint.targetId];

      if (!sourcePos || !targetPos) continue;

      const currentLength = sourcePos.distanceTo(targetPos);
      const error = currentLength - constraint.targetLength;

      totalViolation += Math.abs(error);

      // Skip if error is within tolerance
      if (Math.abs(error) < tolerance) continue;

      // Direction from source to target
      const direction = new THREE.Vector3()
        .subVectors(targetPos, sourcePos)
        .normalize();

      // Correction vector (half for each endpoint)
      const correction = direction.multiplyScalar(error * relaxationFactor);

      // Apply correction based on which nodes are pinned
      const sourceIsPinned = pinnedNodes.has(constraint.sourceId);
      const targetIsPinned = pinnedNodes.has(constraint.targetId);

      if (sourceIsPinned && targetIsPinned) {
        // Both pinned, can't correct
        continue;
      } else if (sourceIsPinned) {
        // Only source is pinned, move target fully
        targetPos.sub(correction.multiplyScalar(2));
      } else if (targetIsPinned) {
        // Only target is pinned, move source fully
        sourcePos.add(correction.multiplyScalar(2));
      } else {
        // Both free, move each by half
        sourcePos.add(correction);
        targetPos.sub(correction);
      }
    }

    // Check convergence
    if (totalViolation < tolerance * constraints.length) {
      converged = true;
      break;
    }
  }

  // Compute final violations
  const violations: EdgeViolation[] = [];
  constraints.forEach((constraint, i) => {
    const sourcePos = newPositions[constraint.sourceId];
    const targetPos = newPositions[constraint.targetId];

    if (!sourcePos || !targetPos) return;

    const currentLength = sourcePos.distanceTo(targetPos);
    const error = Math.abs(currentLength - constraint.targetLength);
    const relativeError =
      constraint.targetLength > 0 ? error / constraint.targetLength : error;

    violations.push({
      edgeId: `e${i}`,
      sourceId: constraint.sourceId,
      targetId: constraint.targetId,
      currentLength,
      targetLength: constraint.targetLength,
      error,
      relativeError,
    });
  });

  return {
    positions: newPositions,
    violations,
    totalViolation,
    converged,
  };
}

/**
 * Find valid flex directions for a flexible vertex in a linkage.
 *
 * For a vertex v connected to neighbors u₁, u₂, ..., uₖ with fixed edge lengths,
 * the valid flex directions are tangent to all constraint spheres at v's current position.
 *
 * Mathematically, this is the null space of the local rigidity constraints.
 *
 * @param nodeId - The node to find flex directions for
 * @param positions - Current positions
 * @param constraints - Edge constraints involving this node
 * @returns Array of valid flex direction vectors (unit vectors)
 */
export function computeFlexDirections(
  nodeId: string,
  positions: { [nodeId: string]: THREE.Vector3 },
  constraints: EdgeConstraint[]
): THREE.Vector3[] {
  const nodePos = positions[nodeId];
  if (!nodePos) return [];

  // Find constraints involving this node
  const relevantConstraints = constraints.filter(
    (c) => c.sourceId === nodeId || c.targetId === nodeId
  );

  if (relevantConstraints.length === 0) {
    // No constraints, all directions are valid
    return [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 1),
    ];
  }

  // Compute constraint normals (directions to neighbors)
  const normals: THREE.Vector3[] = [];
  for (const constraint of relevantConstraints) {
    const otherId =
      constraint.sourceId === nodeId ? constraint.targetId : constraint.sourceId;
    const otherPos = positions[otherId];
    if (!otherPos) continue;

    const normal = new THREE.Vector3()
      .subVectors(otherPos, nodePos)
      .normalize();
    normals.push(normal);
  }

  // For 1 constraint: all directions perpendicular to the constraint normal
  if (normals.length === 1) {
    // Find two perpendicular directions
    const n = normals[0];
    const arbitrary = Math.abs(n.x) < 0.9
      ? new THREE.Vector3(1, 0, 0)
      : new THREE.Vector3(0, 1, 0);
    const perp1 = new THREE.Vector3().crossVectors(n, arbitrary).normalize();
    const perp2 = new THREE.Vector3().crossVectors(n, perp1).normalize();
    return [perp1, perp2];
  }

  // For 2 constraints: direction perpendicular to both normals
  if (normals.length === 2) {
    const flex = new THREE.Vector3()
      .crossVectors(normals[0], normals[1])
      .normalize();
    if (flex.lengthSq() > 0.001) {
      return [flex, flex.clone().negate()];
    }
    // Normals are parallel, effectively 1 constraint
    return [];
  }

  // For 3+ constraints in 3D: typically no flex directions (rigid)
  // unless the constraints are degenerate
  return [];
}

/**
 * Apply a nudge to a node along a valid flex direction, then project to constraints.
 *
 * @param nodeId - Node to nudge
 * @param direction - Direction to nudge (will be normalized)
 * @param amount - Distance to move
 * @param positions - Current positions
 * @param constraints - Edge constraints
 * @param pinnedNodes - Nodes that cannot move
 * @returns New positions after nudge and projection
 */
export function nudgeWithConstraints(
  nodeId: string,
  direction: THREE.Vector3,
  amount: number,
  positions: { [nodeId: string]: THREE.Vector3 },
  constraints: EdgeConstraint[],
  pinnedNodes: Set<string> = new Set()
): ProjectionResult {
  // Clone positions
  const newPositions: { [nodeId: string]: THREE.Vector3 } = {};
  for (const [id, pos] of Object.entries(positions)) {
    newPositions[id] = pos.clone();
  }

  // Apply nudge
  if (newPositions[nodeId] && !pinnedNodes.has(nodeId)) {
    const normalizedDir = direction.clone().normalize();
    newPositions[nodeId].add(normalizedDir.multiplyScalar(amount));
  }

  // Project to constraints
  return projectToConstraints(newPositions, constraints, {
    iterations: 20,
    tolerance: 0.0001,
    pinnedNodes,
  });
}

/**
 * Determine the color for an edge based on its constraint violation.
 *
 * @param violation - The edge violation info
 * @param thresholds - Error thresholds for color changes
 * @returns Hex color value
 */
export function getViolationColor(
  violation: EdgeViolation,
  thresholds: { warning: number; error: number } = {
    warning: 0.01,
    error: 0.05,
  }
): number {
  if (violation.relativeError > thresholds.error) {
    return 0xff0000; // Red for significant violation
  } else if (violation.relativeError > thresholds.warning) {
    return 0xffaa00; // Orange for minor violation
  }
  return 0x00ff00; // Green for satisfied constraint
}

/**
 * Convert graph node positions to the format expected by the constraint solver.
 *
 * @param graph - The graph
 * @param nodeMeshMap - Map of node IDs to Three.js meshes
 * @returns Position map for the constraint solver
 */
export function extractPositions(
  graph: Graph,
  nodeMeshMap: { [nodeId: string]: THREE.Mesh }
): { [nodeId: string]: THREE.Vector3 } {
  const positions: { [nodeId: string]: THREE.Vector3 } = {};

  graph.forEachNode((nodeId) => {
    const mesh = nodeMeshMap[nodeId];
    if (mesh) {
      positions[nodeId] = mesh.position.clone();
    }
  });

  return positions;
}

/**
 * Apply computed positions back to the Three.js meshes.
 *
 * @param positions - Position map from constraint solver
 * @param nodeMeshMap - Map of node IDs to Three.js meshes
 */
export function applyPositions(
  positions: { [nodeId: string]: THREE.Vector3 },
  nodeMeshMap: { [nodeId: string]: THREE.Mesh }
): void {
  for (const [nodeId, pos] of Object.entries(positions)) {
    const mesh = nodeMeshMap[nodeId];
    if (mesh) {
      mesh.position.copy(pos);
    }
  }
}
