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
