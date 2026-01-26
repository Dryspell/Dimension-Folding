// matrixUtils.ts - Matrix operations for graph analysis
import Graph from "graphology";
import * as THREE from "three";

/**
 * Create the adjacency matrix for a graph.
 * A[i,j] = 1 if vertices i and j are connected by an edge.
 */
export const createAdjacencyMatrix = (graph: Graph) => {
  const nodes = graph.nodes();
  const matrix = Array(nodes.length)
    .fill(null)
    .map(() => Array(nodes.length).fill(0));

  nodes.forEach((source, i) => {
    nodes.forEach((target, j) => {
      if (graph.hasEdge(source, target) || graph.hasEdge(target, source)) {
        matrix[i][j] = 1;
        matrix[j][i] = 1; // Ensure symmetry for undirected graphs
      }
    });
  });

  const labels = nodes.map((node) => graph.getNodeAttribute(node, "label"));
  return { matrix, labels };
};

/**
 * Create the incidence matrix for a graph.
 * Rows = vertices, Columns = edges.
 * M[v,e] = 1 if vertex v is incident to edge e.
 */
export const createIncidenceMatrix = (graph: Graph) => {
  const nodes = graph.nodes();
  const edges = graph.edges();
  const matrix = Array(nodes.length)
    .fill(null)
    .map(() => Array(edges.length).fill(0));

  edges.forEach((edge, edgeIndex) => {
    const [source, target] = graph.extremities(edge);
    const sourceIndex = nodes.indexOf(source);
    const targetIndex = nodes.indexOf(target);
    if (sourceIndex !== -1) matrix[sourceIndex][edgeIndex] = 1;
    if (targetIndex !== -1) matrix[targetIndex][edgeIndex] = 1;
  });

  const rowLabels = nodes.map((node) => graph.getNodeAttribute(node, "label"));
  const colLabels = edges;
  return { matrix, rowLabels, colLabels };
};

/**
 * Assign 3D coordinates to graph nodes in "generic position".
 *
 * Generic position means the vertices are placed to avoid:
 * - Collinear points (unless required by the graph structure)
 * - Special symmetric positions that hide degrees of freedom
 * - Degenerate configurations
 *
 * For a graph with n vertices, we place them as:
 * - Node 0: origin (0, 0, 0)
 * - Node 1: (1, 0, 0)
 * - Node 2: (0, 1, 0)
 * - Node 3: (0, 0, 1) if it exists
 * - Additional nodes get positions that maintain generic position
 *
 * This ensures the framework is in generic position for rigidity analysis.
 */
export const assignIndependentCoordinates = (graph: Graph) => {
  const nodes = graph.nodes();

  nodes.forEach((node, index) => {
    let coordinates: [number, number, number];

    switch (index) {
      case 0:
        coordinates = [0, 0, 0];
        break;
      case 1:
        coordinates = [1, 0, 0];
        break;
      case 2:
        coordinates = [0, 1, 0];
        break;
      case 3:
        coordinates = [0, 0, 1];
        break;
      default:
        // For additional nodes, use a generic position
        // Offset to avoid special positions
        coordinates = [
          (index % 3) * 0.5 + 0.25,
          Math.floor(index / 3) * 0.5 + 0.25,
          (index % 2) * 0.5,
        ];
    }

    graph.mergeNodeAttributes(node, { coordinates });
  });
};

/**
 * Create a coordinate matrix from graph node positions.
 */
export const createCoordinateMatrix = (graph: Graph) => {
  const nodes = graph.nodes();
  const labels = nodes.map((node) => graph.getNodeAttribute(node, "label") as string);
  const matrix = nodes.map(
    (node) => graph.getNodeAttribute(node, "coordinates") as [number, number, number]
  );

  return { matrix, labels };
};

/**
 * Update coordinate matrix with current 3D mesh positions.
 * Used to sync the UI display with the Three.js scene.
 */
export function updateCoordinates(
  graph: Graph,
  nodeMeshMap: { [nodeId: string]: THREE.Mesh }
): { [key: string]: [number, number, number] } {
  const newCoordinates: { [key: string]: [number, number, number] } = {};

  graph.forEachNode((nodeId, attr) => {
    const nodeMesh = nodeMeshMap[nodeId];
    if (nodeMesh) {
      newCoordinates[attr.label] = [
        nodeMesh.position.x,
        nodeMesh.position.y,
        nodeMesh.position.z,
      ];
    }
  });

  return newCoordinates;
}

// ============================================================================
// Rigidity Matrix and Linear Algebra
// ============================================================================

/**
 * Create the rigidity matrix for a framework (graph with positions).
 *
 * The rigidity matrix R is the Jacobian of the edge length constraints.
 * - Rows: one per edge (m rows)
 * - Columns: d coordinates per vertex (d×n columns for n vertices in ℝᵈ)
 *
 * For edge e = (u, v), the row has:
 *   R[e, (u, i)] = p_u[i] - p_v[i]  (coordinate i of u minus coordinate i of v)
 *   R[e, (v, i)] = p_v[i] - p_u[i]  (coordinate i of v minus coordinate i of u)
 *   All other entries are 0.
 *
 * The framework is infinitesimally rigid iff:
 *   rank(R) = d|V| - d(d+1)/2
 *
 * @param graph - The graph structure
 * @param coordinates - Map from node label to [x, y, z] position
 * @param dimension - Embedding dimension (2 or 3), defaults to 3
 * @returns Rigidity matrix with row/column labels
 */
export function createRigidityMatrix(
  graph: Graph,
  coordinates: { [key: string]: [number, number, number] },
  dimension: 2 | 3 = 3
): {
  matrix: number[][];
  rowLabels: string[];
  colLabels: string[];
  edges: [string, string][];
} {
  const nodes = graph.nodes();
  const edges = graph.edges();
  const n = nodes.length;
  const m = edges.length;
  const d = dimension;

  // Create node label → index mapping
  const nodeIndex: { [nodeId: string]: number } = {};
  nodes.forEach((nodeId, i) => {
    nodeIndex[nodeId] = i;
  });

  // Create node ID → label mapping
  const nodeLabel: { [nodeId: string]: string } = {};
  nodes.forEach((nodeId) => {
    nodeLabel[nodeId] = graph.getNodeAttribute(nodeId, "label") as string;
  });

  // Initialize m × (d*n) matrix with zeros
  const matrix: number[][] = Array(m)
    .fill(null)
    .map(() => Array(d * n).fill(0));

  // Edge list for labels
  const edgePairs: [string, string][] = [];

  // Fill in the rigidity matrix
  edges.forEach((edgeId, edgeIndex) => {
    const [sourceId, targetId] = graph.extremities(edgeId);
    const sourceLabel = nodeLabel[sourceId];
    const targetLabel = nodeLabel[targetId];

    edgePairs.push([sourceLabel, targetLabel]);

    const sourceCoords = coordinates[sourceLabel];
    const targetCoords = coordinates[targetLabel];

    if (!sourceCoords || !targetCoords) {
      console.warn(`Missing coordinates for edge ${sourceLabel}-${targetLabel}`);
      return;
    }

    const u = nodeIndex[sourceId];
    const v = nodeIndex[targetId];

    // For each coordinate dimension
    for (let i = 0; i < d; i++) {
      const diff = sourceCoords[i] - targetCoords[i];

      // Source vertex columns: u*d + i
      matrix[edgeIndex][u * d + i] = diff;

      // Target vertex columns: v*d + i
      matrix[edgeIndex][v * d + i] = -diff;
    }
  });

  // Create column labels: "Node1.x", "Node1.y", "Node1.z", "Node2.x", ...
  const colLabels: string[] = [];
  const dimLabels = ["x", "y", "z"].slice(0, d);
  nodes.forEach((nodeId) => {
    const label = nodeLabel[nodeId];
    dimLabels.forEach((dim) => {
      colLabels.push(`${label}.${dim}`);
    });
  });

  // Row labels: "e1: Node1-Node2", ...
  const rowLabels = edgePairs.map(([a, b], i) => `e${i + 1}: ${a}-${b}`);

  return { matrix, rowLabels, colLabels, edges: edgePairs };
}

/**
 * Compute the rank of a matrix using Gaussian elimination with partial pivoting.
 *
 * @param matrix - The input matrix (will not be modified)
 * @param tolerance - Threshold for considering a value as zero
 * @returns The rank of the matrix
 */
export function computeMatrixRank(
  matrix: number[][],
  tolerance: number = 1e-10
): number {
  if (matrix.length === 0 || matrix[0].length === 0) return 0;

  const m = matrix.length;
  const n = matrix[0].length;

  // Create a copy to avoid mutating the original
  const A = matrix.map((row) => [...row]);

  let rank = 0;
  let col = 0;

  for (let row = 0; row < m && col < n; row++) {
    // Find the pivot (largest absolute value in current column)
    let maxRow = row;
    let maxVal = Math.abs(A[row][col]);

    for (let i = row + 1; i < m; i++) {
      if (Math.abs(A[i][col]) > maxVal) {
        maxVal = Math.abs(A[i][col]);
        maxRow = i;
      }
    }

    if (maxVal < tolerance) {
      // No pivot in this column, move to next column
      col++;
      row--; // Stay on same row
      continue;
    }

    // Swap rows
    [A[row], A[maxRow]] = [A[maxRow], A[row]];

    // Eliminate below
    for (let i = row + 1; i < m; i++) {
      const factor = A[i][col] / A[row][col];
      for (let j = col; j < n; j++) {
        A[i][j] -= factor * A[row][j];
      }
    }

    rank++;
    col++;
  }

  return rank;
}

/**
 * Compute the null space of a matrix using Gaussian elimination.
 * Returns basis vectors for the null space (kernel).
 *
 * The null space vectors represent infinitesimal motions that preserve edge lengths.
 * For a rigid framework, the null space contains only trivial motions
 * (rotations and translations).
 *
 * @param matrix - The input matrix
 * @param tolerance - Threshold for considering a value as zero
 * @returns Array of null space basis vectors
 */
export function computeNullSpace(
  matrix: number[][],
  tolerance: number = 1e-10
): number[][] {
  if (matrix.length === 0 || matrix[0].length === 0) return [];

  const m = matrix.length;
  const n = matrix[0].length;

  // Create augmented matrix [A | I] for row reduction
  const A = matrix.map((row) => [...row]);

  // Track pivot columns
  const pivotCols: number[] = [];
  let pivotRow = 0;

  // Row reduce to echelon form
  for (let col = 0; col < n && pivotRow < m; col++) {
    // Find pivot
    let maxRow = pivotRow;
    let maxVal = Math.abs(A[pivotRow][col]);

    for (let i = pivotRow + 1; i < m; i++) {
      if (Math.abs(A[i][col]) > maxVal) {
        maxVal = Math.abs(A[i][col]);
        maxRow = i;
      }
    }

    if (maxVal < tolerance) continue;

    // Swap rows
    [A[pivotRow], A[maxRow]] = [A[maxRow], A[pivotRow]];

    // Scale pivot row
    const pivot = A[pivotRow][col];
    for (let j = 0; j < n; j++) {
      A[pivotRow][j] /= pivot;
    }

    // Eliminate column
    for (let i = 0; i < m; i++) {
      if (i !== pivotRow && Math.abs(A[i][col]) > tolerance) {
        const factor = A[i][col];
        for (let j = 0; j < n; j++) {
          A[i][j] -= factor * A[pivotRow][j];
        }
      }
    }

    pivotCols.push(col);
    pivotRow++;
  }

  // Free variables (columns without pivots)
  const freeCols = [];
  for (let col = 0; col < n; col++) {
    if (!pivotCols.includes(col)) {
      freeCols.push(col);
    }
  }

  // Build null space vectors
  const nullSpace: number[][] = [];

  for (const freeCol of freeCols) {
    const vec = Array(n).fill(0);
    vec[freeCol] = 1;

    // Back-substitute
    for (let i = pivotCols.length - 1; i >= 0; i--) {
      const pivotCol = pivotCols[i];
      vec[pivotCol] = -A[i][freeCol];
    }

    nullSpace.push(vec);
  }

  return nullSpace;
}

/**
 * Compute the number of trivial degrees of freedom for a framework in dimension d.
 * Trivial motions are rigid motions (translations and rotations).
 *
 * In ℝᵈ: d translations + d(d-1)/2 rotations = d + d(d-1)/2 = d(d+1)/2
 * - ℝ²: 3 trivial DOF (2 translations + 1 rotation)
 * - ℝ³: 6 trivial DOF (3 translations + 3 rotations)
 *
 * @param dimension - The embedding dimension
 * @returns Number of trivial degrees of freedom
 */
export function computeTrivialDOF(dimension: number): number {
  return (dimension * (dimension + 1)) / 2;
}

/**
 * Compute the internal (non-trivial) degrees of freedom for a framework.
 *
 * Internal DOF = d|V| - trivial - rank(R)
 *
 * Where:
 * - d|V| = total coordinate space dimension
 * - trivial = d(d+1)/2 (translations + rotations)
 * - rank(R) = rank of the rigidity matrix
 *
 * A framework is infinitesimally rigid iff internal DOF = 0.
 *
 * @param rank - Rank of the rigidity matrix
 * @param vertices - Number of vertices
 * @param dimension - Embedding dimension
 * @returns Number of internal degrees of freedom
 */
export function computeInternalDOF(
  rank: number,
  vertices: number,
  dimension: number
): number {
  const totalDOF = dimension * vertices;
  const trivialDOF = computeTrivialDOF(dimension);
  const internalDOF = totalDOF - trivialDOF - rank;
  return Math.max(0, internalDOF);
}

/**
 * Check if a framework is infinitesimally rigid.
 *
 * A framework is infinitesimally rigid iff rank(R) = d|V| - d(d+1)/2.
 * Equivalently, the internal DOF equals 0.
 *
 * @param graph - The graph structure
 * @param coordinates - Vertex positions
 * @param dimension - Embedding dimension
 * @returns True if the framework is infinitesimally rigid
 */
export function isInfinitesimallyRigid(
  graph: Graph,
  coordinates: { [key: string]: [number, number, number] },
  dimension: 2 | 3 = 3
): boolean {
  const { matrix } = createRigidityMatrix(graph, coordinates, dimension);
  const rank = computeMatrixRank(matrix);
  const n = graph.order; // number of vertices
  const expectedRank = dimension * n - computeTrivialDOF(dimension);
  return rank >= expectedRank;
}

/**
 * Describe a transformation matrix in human-readable form.
 * Useful for displaying transformation steps in the UI.
 */
export function describeTransformation(matrix: THREE.Matrix4): string {
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();

  matrix.decompose(position, quaternion, scale);

  const descriptions: string[] = [];

  // Check for translation
  if (position.lengthSq() > 0.0001) {
    descriptions.push(`Translate by (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`);
  }

  // Check for scale
  if (Math.abs(scale.x - 1) > 0.0001 || Math.abs(scale.y - 1) > 0.0001 || Math.abs(scale.z - 1) > 0.0001) {
    if (scale.x === scale.y && scale.y === scale.z) {
      descriptions.push(`Scale uniformly by ${scale.x.toFixed(2)}`);
    } else {
      descriptions.push(`Scale by (${scale.x.toFixed(2)}, ${scale.y.toFixed(2)}, ${scale.z.toFixed(2)})`);
    }
  }

  // Check for rotation
  const euler = new THREE.Euler().setFromQuaternion(quaternion);
  const threshold = 0.0001;
  if (Math.abs(euler.x) > threshold || Math.abs(euler.y) > threshold || Math.abs(euler.z) > threshold) {
    const toDeg = (rad: number) => ((rad * 180) / Math.PI).toFixed(0);
    descriptions.push(`Rotate (${toDeg(euler.x)}°, ${toDeg(euler.y)}°, ${toDeg(euler.z)}°)`);
  }

  return descriptions.length > 0 ? descriptions.join(", ") : "Identity";
}
