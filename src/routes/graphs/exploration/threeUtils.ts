// threeUtils.ts - Three.js utility functions for graph visualization
import { createEffect, Accessor } from "solid-js";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Graph from "graphology";

/**
 * Initialize the Three.js scene with camera, renderer, and controls.
 */
export function initSceneAndControls(
  width: number,
  height: number,
  containerRef: HTMLDivElement
) {
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.set(3, 3, 3);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setClearColor(new THREE.Color("#fafafa"));
  containerRef.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.enableZoom = true;

  return { renderer, controls, camera };
}

/**
 * Draw edges between nodes. Creates LineSegments and adds them to the scene.
 */
export function drawEdges(
  graph: Graph,
  nodeMeshMap: { [nodeId: string]: THREE.Mesh },
  scene: THREE.Scene,
  edges: THREE.LineSegments[]
) {
  graph.forEachEdge((edge, attributes, source, target) => {
    const material = new THREE.LineBasicMaterial({
      color: attributes.color || "gray",
      linewidth: 2,
    });
    const geometry = new THREE.BufferGeometry();

    const sourceNode = nodeMeshMap[source];
    const targetNode = nodeMeshMap[target];
    geometry.setFromPoints([sourceNode.position.clone(), targetNode.position.clone()]);

    const line = new THREE.LineSegments(geometry, material);
    edges.push(line);
    scene.add(line);
  });
}

/**
 * Update edge positions based on current node positions.
 */
export function updateEdges(
  graph: Graph,
  nodeMeshMap: { [nodeId: string]: THREE.Mesh },
  edges: THREE.LineSegments[]
) {
  const edgeList = graph.edges();
  edgeList.forEach((edge, edgeIndex) => {
    const [source, target] = graph.extremities(edge);
    const sourceNode = nodeMeshMap[source];
    const targetNode = nodeMeshMap[target];
    const line = edges[edgeIndex];

    if (!line) return;

    const positions = line.geometry.attributes.position.array as Float32Array;
    positions[0] = sourceNode.position.x;
    positions[1] = sourceNode.position.y;
    positions[2] = sourceNode.position.z;
    positions[3] = targetNode.position.x;
    positions[4] = targetNode.position.y;
    positions[5] = targetNode.position.z;

    line.geometry.attributes.position.needsUpdate = true;
  });
}

/**
 * Populate the scene with node meshes from the graph.
 * Stores original positions for animation calculations.
 * Note: Edges are drawn separately via drawEdges() to avoid duplication.
 */
export function populateGraphScene(
  graph: Graph,
  originalPositions: THREE.Vector3[],
  nodeMeshes: THREE.Mesh[],
  nodeMeshMap: { [nodeId: string]: THREE.Mesh },
  scene: THREE.Scene
) {
  const nodes = graph.nodes();

  nodes.forEach((node, index) => {
    const attr = graph.getNodeAttributes(node);
    const color = new THREE.Color(attr.color || "blue");
    const material = new THREE.MeshBasicMaterial({ color });
    const geometry = new THREE.SphereGeometry(0.1, 16, 16);
    const sphere = new THREE.Mesh(geometry, material);

    // Get coordinates from graph attributes
    const coords = attr.coordinates || [0, 0, 0];
    const [x, y, z] = coords;
    const position = new THREE.Vector3(x, y, z || 0);

    sphere.position.copy(position);
    sphere.userData = {
      label: attr.label,
      coordinates: [position.x, position.y, position.z],
      nodeId: node,
    };

    // Store original position (immutable reference for calculations)
    originalPositions.push(position.clone());
    nodeMeshes.push(sphere);
    nodeMeshMap[node] = sphere;

    scene.add(sphere);
  });
}

/**
 * Add grid helpers to the scene (XZ and YZ planes).
 */
export function addGridHelpers(showGrid: Accessor<boolean>, scene: THREE.Scene) {
  const gridSize = 2;
  const gridDivisions = 10;

  const xGrid = new THREE.GridHelper(gridSize, gridDivisions);
  xGrid.rotation.z = Math.PI / 2;
  xGrid.visible = showGrid();
  scene.add(xGrid);

  const yGrid = new THREE.GridHelper(gridSize, gridDivisions);
  yGrid.rotation.x = Math.PI / 2;
  yGrid.visible = showGrid();
  scene.add(yGrid);

  createEffect(() => {
    xGrid.visible = showGrid();
    yGrid.visible = showGrid();
  });
}

/**
 * Add axes helper and tick marks to the scene.
 */
export function addAxesHelper(scene: THREE.Scene) {
  const axesHelper = new THREE.AxesHelper(2);
  scene.add(axesHelper);

  // Add tick marks along each axis
  const tickMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
  const tickGeometry = new THREE.SphereGeometry(0.02, 8, 8);
  const tickSpacing = 0.5;
  const tickCount = 5;

  for (let i = -tickCount; i <= tickCount; i++) {
    if (i === 0) continue;

    // X-axis ticks
    const xTick = new THREE.Mesh(tickGeometry, tickMaterial);
    xTick.position.set(i * tickSpacing, 0, 0);
    scene.add(xTick);

    // Y-axis ticks
    const yTick = new THREE.Mesh(tickGeometry, tickMaterial);
    yTick.position.set(0, i * tickSpacing, 0);
    scene.add(yTick);

    // Z-axis ticks
    const zTick = new THREE.Mesh(tickGeometry, tickMaterial);
    zTick.position.set(0, 0, i * tickSpacing);
    scene.add(zTick);
  }
}

// ============================================================================
// Constraint Visualization (Sphere Intersections)
// ============================================================================

/**
 * Calculate the intersection of two spheres.
 * Returns null if no intersection, a Vector3 if tangent (single point),
 * or an object with center, radius, and normal if they intersect in a circle.
 */
function calculateCircleOfIntersection(
  centerA: THREE.Vector3,
  radiusA: number,
  centerB: THREE.Vector3,
  radiusB: number
): { center: THREE.Vector3; radius: number; normal: THREE.Vector3 } | THREE.Vector3 | null {
  const d = centerA.distanceTo(centerB);

  // No intersection - spheres too far apart or one inside the other
  if (d > radiusA + radiusB || d < Math.abs(radiusA - radiusB)) {
    return null;
  }

  // Tangent intersection (single point)
  if (Math.abs(d - (radiusA + radiusB)) < 0.0001 || Math.abs(d - Math.abs(radiusA - radiusB)) < 0.0001) {
    const point = new THREE.Vector3()
      .copy(centerB)
      .sub(centerA)
      .multiplyScalar(radiusA / d)
      .add(centerA);
    return point;
  }

  // Circle intersection
  const a = (radiusA * radiusA - radiusB * radiusB + d * d) / (2 * d);
  const center = new THREE.Vector3()
    .copy(centerB)
    .sub(centerA)
    .multiplyScalar(a / d)
    .add(centerA);

  const radiusSquared = radiusA * radiusA - a * a;
  if (radiusSquared < 0) return null;

  const radius = Math.sqrt(radiusSquared);
  const normal = new THREE.Vector3().subVectors(centerB, centerA).normalize();

  return { center, radius, normal };
}

/**
 * Calculate intersection points of two circles in 3D space.
 */
function calculateIntersectionOfTwoCircles(
  centerA: THREE.Vector3,
  radiusA: number,
  normalA: THREE.Vector3,
  centerB: THREE.Vector3,
  radiusB: number,
  normalB: THREE.Vector3
): THREE.Vector3[] | null {
  // Find line of intersection between the planes
  const lineDirection = new THREE.Vector3().crossVectors(normalA, normalB);

  // If normals are parallel, circles don't intersect
  if (lineDirection.lengthSq() < 0.0001) return null;
  lineDirection.normalize();

  // Project circle centers onto the line
  const projectedCenterA = centerA.clone().projectOnVector(lineDirection);
  const projectedCenterB = centerB.clone().projectOnVector(lineDirection);

  const distance = projectedCenterA.distanceTo(projectedCenterB);

  // Check if circles can intersect
  if (distance > radiusA + radiusB || distance < Math.abs(radiusA - radiusB)) return null;
  if (distance === 0) return null; // Concentric

  // Calculate intersection points
  const a = (radiusA * radiusA - radiusB * radiusB + distance * distance) / (2 * distance);
  const hSquared = radiusA * radiusA - a * a;
  if (hSquared < 0) return null;

  const h = Math.sqrt(hSquared);
  const intersectionCenter = projectedCenterA
    .clone()
    .add(lineDirection.clone().multiplyScalar(a / distance));

  const perpDirection = new THREE.Vector3().crossVectors(lineDirection, normalA).normalize();

  return [
    intersectionCenter.clone().add(perpDirection.clone().multiplyScalar(h)),
    intersectionCenter.clone().sub(perpDirection.clone().multiplyScalar(h)),
  ];
}

/**
 * Create spheres and intersection visualizations for constraint display.
 */
export function createSpheresAndIntersections(
  graph: Graph,
  nodeMeshMap: { [nodeId: string]: THREE.Mesh },
  scene: THREE.Scene,
  spheres: THREE.Mesh[],
  circles: THREE.Mesh[],
  intersectionPoints: THREE.Mesh[]
) {
  graph.forEachNode((nodeId) => {
    const nodeMesh = nodeMeshMap[nodeId];
    const neighbors = Array.from(graph.neighbors(nodeId));

    // Create constraint spheres for each neighbor
    neighbors.forEach((neighborId) => {
      const neighborMesh = nodeMeshMap[neighborId];
      const radius = nodeMesh.position.distanceTo(neighborMesh.position);

      const geometry = new THREE.SphereGeometry(radius, 32, 32);
      const material = new THREE.MeshBasicMaterial({
        color: 0x8888ff,
        wireframe: true,
        opacity: 0.2,
        transparent: true,
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.copy(neighborMesh.position);
      spheres.push(sphere);
      scene.add(sphere);
    });

    // Calculate pairwise sphere intersections (circles)
    const circleData: { center: THREE.Vector3; radius: number; normal: THREE.Vector3 }[] = [];

    for (let i = 0; i < neighbors.length - 1; i++) {
      for (let j = i + 1; j < neighbors.length; j++) {
        const centerA = nodeMeshMap[neighbors[i]].position;
        const centerB = nodeMeshMap[neighbors[j]].position;
        const radiusA = nodeMesh.position.distanceTo(centerA);
        const radiusB = nodeMesh.position.distanceTo(centerB);

        const result = calculateCircleOfIntersection(centerA, radiusA, centerB, radiusB);
        if (result) {
          if (result instanceof THREE.Vector3) {
            createPoint(scene, result, intersectionPoints);
          } else {
            circleData.push(result);
            createCircle(scene, result, circles);
          }
        }
      }
    }

    // Calculate circle-circle intersections (points)
    for (let i = 0; i < circleData.length - 1; i++) {
      for (let j = i + 1; j < circleData.length; j++) {
        const points = calculateIntersectionOfTwoCircles(
          circleData[i].center,
          circleData[i].radius,
          circleData[i].normal,
          circleData[j].center,
          circleData[j].radius,
          circleData[j].normal
        );

        if (points) {
          points.forEach((point) => createPoint(scene, point, intersectionPoints));
        }
      }
    }
  });
}

/**
 * Update spheres and intersections during animation.
 */
export function updateSpheresAndIntersections(
  scene: THREE.Scene,
  graph: Graph,
  nodeMeshMap: { [nodeId: string]: THREE.Mesh },
  spheres: THREE.Mesh[],
  circles: THREE.Mesh[],
  intersectionPoints: THREE.Mesh[]
) {
  let sphereIndex = 0;
  let circleIndex = 0;
  let pointIndex = 0;

  graph.forEachNode((nodeId) => {
    const nodeMesh = nodeMeshMap[nodeId];
    const neighbors = Array.from(graph.neighbors(nodeId));

    // Update spheres
    neighbors.forEach((neighborId) => {
      const neighborMesh = nodeMeshMap[neighborId];
      const radius = nodeMesh.position.distanceTo(neighborMesh.position);

      if (spheres[sphereIndex]) {
        const sphere = spheres[sphereIndex];
        sphere.position.copy(neighborMesh.position);
        sphere.geometry.dispose();
        sphere.geometry = new THREE.SphereGeometry(radius, 32, 32);
        sphere.visible = true;
      }
      sphereIndex++;
    });

    // Update circles
    const circleData: { center: THREE.Vector3; radius: number; normal: THREE.Vector3 }[] = [];

    for (let i = 0; i < neighbors.length - 1; i++) {
      for (let j = i + 1; j < neighbors.length; j++) {
        const centerA = nodeMeshMap[neighbors[i]].position;
        const centerB = nodeMeshMap[neighbors[j]].position;
        const radiusA = nodeMesh.position.distanceTo(centerA);
        const radiusB = nodeMesh.position.distanceTo(centerB);

        const result = calculateCircleOfIntersection(centerA, radiusA, centerB, radiusB);
        if (result) {
          if (result instanceof THREE.Vector3) {
            if (intersectionPoints[pointIndex]) {
              intersectionPoints[pointIndex].position.copy(result);
              intersectionPoints[pointIndex].visible = true;
            }
            pointIndex++;
          } else {
            circleData.push(result);
            if (circles[circleIndex]) {
              const circleMesh = circles[circleIndex];
              circleMesh.position.copy(result.center);
              circleMesh.geometry.dispose();
              circleMesh.geometry = new THREE.RingGeometry(
                result.radius - 0.02,
                result.radius + 0.02,
                64
              );
              circleMesh.lookAt(result.center.clone().add(result.normal));
              circleMesh.visible = true;
            }
            circleIndex++;
          }
        }
      }
    }

    // Update circle-circle intersection points
    for (let i = 0; i < circleData.length - 1; i++) {
      for (let j = i + 1; j < circleData.length; j++) {
        const points = calculateIntersectionOfTwoCircles(
          circleData[i].center,
          circleData[i].radius,
          circleData[i].normal,
          circleData[j].center,
          circleData[j].radius,
          circleData[j].normal
        );

        if (points) {
          points.forEach((point) => {
            if (intersectionPoints[pointIndex]) {
              intersectionPoints[pointIndex].position.copy(point);
              intersectionPoints[pointIndex].visible = true;
            }
            pointIndex++;
          });
        }
      }
    }
  });

  // Hide unused elements
  for (let i = sphereIndex; i < spheres.length; i++) {
    if (spheres[i]) spheres[i].visible = false;
  }
  for (let i = circleIndex; i < circles.length; i++) {
    if (circles[i]) circles[i].visible = false;
  }
  for (let i = pointIndex; i < intersectionPoints.length; i++) {
    if (intersectionPoints[i]) intersectionPoints[i].visible = false;
  }
}

/**
 * Helper to create an intersection point marker.
 */
function createPoint(
  scene: THREE.Scene,
  position: THREE.Vector3,
  intersectionPoints: THREE.Mesh[]
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(0.05, 16, 16);
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const point = new THREE.Mesh(geometry, material);
  point.position.copy(position);
  intersectionPoints.push(point);
  scene.add(point);
  return point;
}

/**
 * Helper to create a circle mesh for intersection visualization.
 */
function createCircle(
  scene: THREE.Scene,
  { center, radius, normal }: { center: THREE.Vector3; radius: number; normal: THREE.Vector3 },
  circles: THREE.Mesh[]
): THREE.Mesh {
  const geometry = new THREE.RingGeometry(radius - 0.02, radius + 0.02, 64);
  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    side: THREE.DoubleSide,
    opacity: 0.5,
    transparent: true,
  });
  const circle = new THREE.Mesh(geometry, material);
  circle.position.copy(center);
  circle.lookAt(center.clone().add(normal));
  circles.push(circle);
  scene.add(circle);
  return circle;
}
