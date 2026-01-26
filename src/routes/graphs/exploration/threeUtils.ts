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
  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
  camera.position.set(4, 3, 4);

  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true,
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  // Soft neutral background - works well with colorful nodes
  renderer.setClearColor(new THREE.Color("#f8fafc"), 1);
  containerRef.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enableZoom = true;
  controls.minDistance = 2;
  controls.maxDistance = 15;
  controls.autoRotate = false;
  controls.autoRotateSpeed = 0.5;

  return { renderer, controls, camera };
}

/**
 * Create a subtle gradient background plane.
 */
export function createGradientBackground(scene: THREE.Scene) {
  // Create a large plane behind the scene with a gradient
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  
  // Create radial gradient - light center, slightly darker edges
  const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 400);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.5, '#f1f5f9');
  gradient.addColorStop(1, '#e2e8f0');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  
  const texture = new THREE.CanvasTexture(canvas);
  const bgGeometry = new THREE.PlaneGeometry(100, 100);
  const bgMaterial = new THREE.MeshBasicMaterial({ 
    map: texture,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
  bgMesh.position.z = -20;
  bgMesh.renderOrder = -1;
  scene.add(bgMesh);
  
  return bgMesh;
}

/**
 * Add lighting to the scene for better 3D appearance.
 */
export function addLighting(scene: THREE.Scene) {
  // Soft ambient light for base illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);
  
  // Main directional light - warm tone from upper right
  const mainLight = new THREE.DirectionalLight(0xfff5e6, 1.0);
  mainLight.position.set(5, 8, 5);
  scene.add(mainLight);
  
  // Fill light from opposite side - cool tone
  const fillLight = new THREE.DirectionalLight(0xe6f0ff, 0.4);
  fillLight.position.set(-5, 3, -5);
  scene.add(fillLight);
  
  // Rim light from behind for edge definition
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
  rimLight.position.set(0, -5, -8);
  scene.add(rimLight);
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
    // Create cylinder-based edges for better visibility
    const sourceNode = nodeMeshMap[source];
    const targetNode = nodeMeshMap[target];
    
    // Use LineBasicMaterial but with better styling
    const material = new THREE.LineBasicMaterial({
      color: attributes.color || "#64748b",
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
    });
    const geometry = new THREE.BufferGeometry();
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
    const color = new THREE.Color(attr.color || "#3b82f6");
    
    // Use MeshPhongMaterial for nice glossy appearance
    const material = new THREE.MeshPhongMaterial({ 
      color,
      emissive: color,
      emissiveIntensity: 0.15,
      specular: new THREE.Color(0xffffff),
      shininess: 100,
      transparent: true,
      opacity: 0.95,
    });
    
    // Smooth spheres with good detail
    const geometry = new THREE.SphereGeometry(0.14, 32, 32);
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
      color: attr.color,
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
  const gridSize = 3;
  const gridDivisions = 12;
  
  // Subtle grid colors for light background
  const gridColor = 0xd1d5db; // Gray-300
  const centerColor = 0x9ca3af; // Gray-400

  const xGrid = new THREE.GridHelper(gridSize, gridDivisions, centerColor, gridColor);
  xGrid.rotation.z = Math.PI / 2;
  xGrid.visible = showGrid();
  (xGrid.material as THREE.Material).opacity = 0.5;
  (xGrid.material as THREE.Material).transparent = true;
  scene.add(xGrid);

  const yGrid = new THREE.GridHelper(gridSize, gridDivisions, centerColor, gridColor);
  yGrid.rotation.x = Math.PI / 2;
  yGrid.visible = showGrid();
  (yGrid.material as THREE.Material).opacity = 0.5;
  (yGrid.material as THREE.Material).transparent = true;
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
  // Create custom colored axes - more subtle for light background
  const axesHelper = new THREE.AxesHelper(2.5);
  // Make axes semi-transparent
  (axesHelper.material as THREE.Material).opacity = 0.6;
  (axesHelper.material as THREE.Material).transparent = true;
  scene.add(axesHelper);

  // Add subtle tick marks along each axis
  const tickMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x94a3b8, // Slate-400
    transparent: true,
    opacity: 0.6,
  });
  const tickGeometry = new THREE.SphereGeometry(0.015, 8, 8);
  const tickSpacing = 0.5;
  const tickCount = 4;

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
 * 
 * For each node, we create:
 * - Spheres centered at each neighbor (showing "where this node could be" given that edge)
 * - Intersection circles of pairs of these spheres (the configuration space for this node)
 * 
 * For a path graph P₃ (A—B—C):
 * - When processing B: spheres at A and C intersect in a circle = B's configuration space
 * - This circle is where B can move while preserving edge lengths to both A and C
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
    const nodeLabel = graph.getNodeAttribute(nodeId, "label") as string;

    // Create constraint spheres for each neighbor
    // Each sphere shows: "this node must be at this distance from this neighbor"
    neighbors.forEach((neighborId) => {
      const neighborMesh = nodeMeshMap[neighborId];
      const radius = nodeMesh.position.distanceTo(neighborMesh.position);

      const geometry = new THREE.SphereGeometry(radius, 48, 48);
      const material = new THREE.MeshBasicMaterial({
        color: 0x3b82f6, // Blue-500
        wireframe: true,
        opacity: 0.15,
        transparent: true,
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.copy(neighborMesh.position);
      sphere.userData.constraintFor = nodeLabel;
      sphere.userData.centeredAt = graph.getNodeAttribute(neighborId, "label");
      spheres.push(sphere);
      scene.add(sphere);
    });

    // Calculate pairwise sphere intersections (circles)
    // These circles represent the configuration space of THIS node
    // given the positions of its neighbors
    const circleData: { center: THREE.Vector3; radius: number; normal: THREE.Vector3 }[] = [];
    
    // If a node has exactly 2 neighbors, the intersection circle IS its configuration space
    const isConfigSpaceCircle = neighbors.length === 2;

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
            const circleMesh = createCircle(scene, result, circles, isConfigSpaceCircle);
            circleMesh.userData.configSpaceOf = nodeLabel;
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
              // Preserve config space styling (thicker cyan circles)
              const isConfigSpace = circleMesh.userData.isConfigSpace === true;
              const thickness = isConfigSpace ? 0.04 : 0.02;
              
              circleMesh.position.copy(result.center);
              circleMesh.geometry.dispose();
              circleMesh.geometry = new THREE.RingGeometry(
                result.radius - thickness,
                result.radius + thickness,
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
  // Bright rose/red for intersection points - stands out on light background
  const geometry = new THREE.SphereGeometry(0.06, 24, 24);
  const material = new THREE.MeshPhongMaterial({ 
    color: 0xf43f5e, // Rose-500
    emissive: 0xf43f5e,
    emissiveIntensity: 0.3,
    shininess: 80,
  });
  const point = new THREE.Mesh(geometry, material);
  point.position.copy(position);
  intersectionPoints.push(point);
  scene.add(point);
  return point;
}

/**
 * Helper to create a circle mesh for intersection visualization.
 * The color indicates whether this is a configuration space circle (cyan) or other intersection (green).
 */
function createCircle(
  scene: THREE.Scene,
  { center, radius, normal }: { center: THREE.Vector3; radius: number; normal: THREE.Vector3 },
  circles: THREE.Mesh[],
  isConfigSpace: boolean = false
): THREE.Mesh {
  // Config space circles are thicker and more prominent
  const thickness = isConfigSpace ? 0.035 : 0.02;
  // Cyan for config space, emerald for other intersections
  const color = isConfigSpace ? 0x06b6d4 : 0x10b981;
  const opacity = isConfigSpace ? 0.8 : 0.6;
  
  const geometry = new THREE.RingGeometry(radius - thickness, radius + thickness, 64);
  const material = new THREE.MeshBasicMaterial({
    color,
    side: THREE.DoubleSide,
    opacity,
    transparent: true,
  });
  const circle = new THREE.Mesh(geometry, material);
  circle.position.copy(center);
  circle.lookAt(center.clone().add(normal));
  circle.userData.isConfigSpace = isConfigSpace;
  circles.push(circle);
  scene.add(circle);
  return circle;
}

// ============================================================================
// Configuration Space Analysis
// ============================================================================

/**
 * Describes the configuration space structure for a single node.
 */
export interface NodeConfigSpace {
  nodeLabel: string;
  degree: number;  // Number of edges (constraints)
  constraintDescription: string;
  configSpaceDescription: string;
  dimension: number;  // Dimension of config space for this node (0, 1, or 2)
}

/**
 * Describes the overall configuration space structure for a graph.
 */
export interface ConfigSpaceAnalysis {
  totalDOF: number;
  trivialDOF: number;
  internalDOF: number;
  nodeAnalysis: NodeConfigSpace[];
  structureDescription: string;
  specialPointsDescription: string;
}

/**
 * Analyze the configuration space structure of a graph.
 * 
 * For a linkage in 3D:
 * - A node with 0 edges: config space = ℝ³ (anywhere in space)
 * - A node with 1 edge: config space = S² (sphere around neighbor)
 * - A node with 2 edges: config space = S¹ (circle = intersection of two spheres)
 * - A node with 3+ edges: config space = point(s) or empty
 */
export function analyzeConfigSpace(graph: Graph): ConfigSpaceAnalysis {
  const nodes = graph.nodes();
  const nodeCount = nodes.length;
  const edgeCount = graph.size;
  
  const nodeAnalysis: NodeConfigSpace[] = [];
  
  nodes.forEach((nodeId) => {
    const label = graph.getNodeAttribute(nodeId, "label") as string;
    const degree = graph.degree(nodeId);
    const neighbors = Array.from(graph.neighbors(nodeId));
    const neighborLabels = neighbors.map(n => graph.getNodeAttribute(n, "label") as string);
    
    let constraintDescription = "";
    let configSpaceDescription = "";
    let dimension = 0;
    
    if (degree === 0) {
      constraintDescription = "No constraints";
      configSpaceDescription = "Free in ℝ³";
      dimension = 3;
    } else if (degree === 1) {
      constraintDescription = `Fixed distance to ${neighborLabels[0]}`;
      configSpaceDescription = `Sphere S² centered at ${neighborLabels[0]}`;
      dimension = 2;
    } else if (degree === 2) {
      constraintDescription = `Fixed distance to ${neighborLabels[0]} and ${neighborLabels[1]}`;
      configSpaceDescription = `Circle S¹ = intersection of spheres at ${neighborLabels[0]} and ${neighborLabels[1]}`;
      dimension = 1;
    } else {
      constraintDescription = `Fixed distance to ${neighborLabels.join(", ")}`;
      configSpaceDescription = `Intersection of ${degree} spheres (discrete points or empty)`;
      dimension = 0;
    }
    
    nodeAnalysis.push({
      nodeLabel: label,
      degree,
      constraintDescription,
      configSpaceDescription,
      dimension,
    });
  });
  
  // Compute DOF (simplified - assumes generic position)
  // Full config space dimension = 3n (3D positions for n nodes)
  // Constraints = number of edges (each edge is 1 constraint)
  // Trivial DOF = 6 in 3D (3 translation + 3 rotation)
  const totalDOF = 3 * nodeCount;
  const trivialDOF = Math.min(6, 3 * nodeCount); // Can't have more trivial than total
  const constraints = edgeCount;
  const internalDOF = Math.max(0, totalDOF - trivialDOF - constraints);
  
  // Structure description
  let structureDescription = "";
  if (nodeCount === 3 && edgeCount === 2) {
    // Path graph P₃ (V-graph)
    structureDescription = 
      "Configuration space C = {(A,B,C) ∈ ℝ⁹ : |A-B| = L₁, |B-C| = L₂}\n" +
      "After fixing A at origin and C on x-axis (mod rigid motions):\n" +
      "C ≅ S¹ (circle) — the intersection of two spheres\n" +
      "The cyan circle shows this configuration space for the middle node.";
  } else if (edgeCount >= 3 * nodeCount - 6) {
    structureDescription = 
      "This graph is rigid (or over-constrained).\n" +
      "Configuration space consists of isolated points.";
  } else {
    structureDescription = 
      `Configuration space C has internal DOF = ${internalDOF}.\n` +
      "The space is the intersection of sphere constraints for each edge.";
  }
  
  // Special points description (for dimension folding)
  const specialPointsDescription = 
    "Special points in C are configurations where all nodes lie in a lower-dimensional subspace:\n" +
    "• C₂ ⊂ C: configurations where nodes span a 2D plane\n" +
    "• C₁ ⊂ C: configurations where nodes are collinear (1D line)\n" +
    "• Folding = finding a path in C from generic point to C₁ or C₂";
  
  return {
    totalDOF,
    trivialDOF,
    internalDOF,
    nodeAnalysis,
    structureDescription,
    specialPointsDescription,
  };
}

// ============================================================================
// Arc Visualization (for transformation paths)
// ============================================================================

/**
 * Represents an arc path on a sphere (great circle arc).
 */
export interface SphereArc {
  /** Center of the sphere (the constraining neighbor) */
  center: THREE.Vector3;
  /** Radius of the sphere (edge length) */
  radius: number;
  /** Starting position on the sphere */
  startPoint: THREE.Vector3;
  /** Ending position on the sphere */
  endPoint: THREE.Vector3;
  /** Angle swept by the arc (radians) */
  angle: number;
  /** Axis of rotation (normal to the plane containing the arc) */
  axis: THREE.Vector3;
}

/**
 * Compute the arc path on a sphere from start to end position.
 * The arc follows a great circle (shortest path on sphere).
 * 
 * @param sphereCenter - Center of the constraint sphere
 * @param startPos - Starting position of the node
 * @param endPos - Ending position of the node
 * @returns Arc data or null if positions don't lie on same sphere
 */
export function computeSphereArc(
  sphereCenter: THREE.Vector3,
  startPos: THREE.Vector3,
  endPos: THREE.Vector3
): SphereArc | null {
  // Compute vectors from center to start and end
  const startVec = startPos.clone().sub(sphereCenter);
  const endVec = endPos.clone().sub(sphereCenter);
  
  const radius = startVec.length();
  const endRadius = endVec.length();
  
  // Check that both points are on the same sphere (within tolerance)
  if (Math.abs(radius - endRadius) > 0.01) {
    console.warn("Start and end positions are not on the same sphere");
    return null;
  }
  
  if (radius < 0.001) return null;
  
  // Normalize to get unit vectors
  const startUnit = startVec.clone().normalize();
  const endUnit = endVec.clone().normalize();
  
  // Compute the angle between them
  const dot = Math.max(-1, Math.min(1, startUnit.dot(endUnit)));
  const angle = Math.acos(dot);
  
  // Compute the rotation axis (perpendicular to both vectors)
  const axis = new THREE.Vector3().crossVectors(startUnit, endUnit);
  
  // Handle case where start and end are the same or opposite
  if (axis.length() < 0.0001) {
    // Points are collinear with center - pick arbitrary perpendicular axis
    axis.set(1, 0, 0);
    if (Math.abs(startUnit.dot(axis)) > 0.9) {
      axis.set(0, 1, 0);
    }
    axis.cross(startUnit).normalize();
  } else {
    axis.normalize();
  }
  
  return {
    center: sphereCenter.clone(),
    radius,
    startPoint: startPos.clone(),
    endPoint: endPos.clone(),
    angle,
    axis,
  };
}

/**
 * Interpolate a position along a sphere arc.
 * 
 * @param arc - The arc to interpolate along
 * @param t - Interpolation factor (0 = start, 1 = end)
 * @returns Position on the arc
 */
export function interpolateArc(arc: SphereArc, t: number): THREE.Vector3 {
  // Get the starting vector from center
  const startVec = arc.startPoint.clone().sub(arc.center);
  
  // Create quaternion for rotation around axis
  const quaternion = new THREE.Quaternion();
  quaternion.setFromAxisAngle(arc.axis, arc.angle * t);
  
  // Rotate the start vector
  const rotatedVec = startVec.applyQuaternion(quaternion);
  
  // Add back the center to get world position
  return rotatedVec.add(arc.center);
}

/**
 * Create a visual arc on a sphere showing the transformation path.
 * 
 * @param scene - Three.js scene
 * @param arc - Arc data
 * @param color - Color of the arc
 * @param segments - Number of line segments
 * @returns The created line object
 */
export function createArcVisualization(
  scene: THREE.Scene,
  arc: SphereArc,
  color: number = 0xff6600,
  segments: number = 32
): THREE.Line {
  const points: THREE.Vector3[] = [];
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    points.push(interpolateArc(arc, t));
  }
  
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color,
    linewidth: 3,
  });
  
  const line = new THREE.Line(geometry, material);
  scene.add(line);
  
  return line;
}

/**
 * Create an arrow at the end of an arc to show direction.
 */
export function createArcArrow(
  scene: THREE.Scene,
  arc: SphereArc,
  color: number = 0xff6600
): THREE.ArrowHelper {
  // Get direction at end of arc (tangent)
  const nearEnd = interpolateArc(arc, 0.95);
  const end = arc.endPoint;
  const direction = end.clone().sub(nearEnd).normalize();
  
  const arrow = new THREE.ArrowHelper(
    direction,
    end,
    0.15, // length
    color,
    0.08, // head length
    0.05  // head width
  );
  
  scene.add(arrow);
  return arrow;
}

/**
 * Compute transformation arcs for all moving nodes.
 * For each node that moves, find its constraining sphere and compute the arc.
 * 
 * @param graph - The graph
 * @param nodeMeshMap - Map of node IDs to meshes
 * @param startPositions - Starting positions (by label)
 * @param endPositions - Ending positions (by label)
 * @returns Array of arcs for visualization
 */
export function computeTransformationArcs(
  graph: Graph,
  nodeMeshMap: { [nodeId: string]: THREE.Mesh },
  startPositions: { [label: string]: [number, number, number] },
  endPositions: { [label: string]: [number, number, number] }
): { nodeLabel: string; arc: SphereArc }[] {
  const arcs: { nodeLabel: string; arc: SphereArc }[] = [];
  
  graph.forEachNode((nodeId, attr) => {
    const label = attr.label as string;
    const start = startPositions[label];
    const end = endPositions[label];
    
    if (!start || !end) return;
    
    // Check if this node actually moves
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const dz = end[2] - start[2];
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (distance < 0.01) return; // Node doesn't move significantly
    
    // Find a neighbor that doesn't move (or moves less) - this is the constraint center
    const neighbors = Array.from(graph.neighbors(nodeId));
    
    for (const neighborId of neighbors) {
      const neighborLabel = graph.getNodeAttribute(neighborId, "label") as string;
      const neighborStart = startPositions[neighborLabel];
      const neighborEnd = endPositions[neighborLabel];
      
      if (!neighborStart || !neighborEnd) continue;
      
      // Check if neighbor moves
      const ndx = neighborEnd[0] - neighborStart[0];
      const ndy = neighborEnd[1] - neighborStart[1];
      const ndz = neighborEnd[2] - neighborStart[2];
      const neighborDistance = Math.sqrt(ndx * ndx + ndy * ndy + ndz * ndz);
      
      // If neighbor moves less, use it as the constraint center
      // For simplicity, we'll use the neighbor's starting position as sphere center
      // (This is a simplification - in reality the sphere moves with the neighbor)
      if (neighborDistance < distance * 0.5) {
        const sphereCenter = new THREE.Vector3(neighborStart[0], neighborStart[1], neighborStart[2]);
        const startPoint = new THREE.Vector3(start[0], start[1], start[2]);
        const endPoint = new THREE.Vector3(end[0], end[1], end[2]);
        
        const arc = computeSphereArc(sphereCenter, startPoint, endPoint);
        if (arc) {
          arcs.push({ nodeLabel: label, arc });
          break; // Only need one constraint per moving node
        }
      }
    }
  });
  
  return arcs;
}
