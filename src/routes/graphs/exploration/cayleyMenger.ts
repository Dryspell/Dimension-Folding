// cayleyMenger.ts - Cayley-Menger determinant computations
//
// This module implements Cayley-Menger determinants for measuring volumes
// and detecting dimensional degeneracy in point configurations.

/**
 * Coordinates type for vertex positions.
 */
export type Coordinates = { [label: string]: [number, number, number] };

/**
 * Result of Cayley-Menger volume analysis.
 */
export interface CMAnalysis {
  /** Current affine dimension of the point set */
  currentDimension: number;
  /** Collinearity determinant (for 3 points, proportional to area²) */
  collinearityDet: number;
  /** Coplanarity determinant (for 4 points, proportional to volume²) */
  coplanarityDet: number | null;
  /** Triangle area (if 3+ points) */
  triangleArea: number;
  /** Tetrahedron volume (if 4+ points) */
  tetrahedronVolume: number | null;
  /** Maximum k-simplex volume (normalized) */
  maxVolume: number;
  /** Progress toward dimension reduction (0 = full volume, 1 = collapsed) */
  progress: number;
  /** Initial volume for progress tracking */
  initialVolume: number;
}

/**
 * Per-sphere-pair tangency analysis.
 */
export interface TangencyInfo {
  /** Labels of the two spheres' center nodes */
  sphere1Center: string;
  sphere2Center: string;
  /** The node these spheres constrain */
  constrainedNode: string;
  /** Distance between sphere centers */
  centerDistance: number;
  /** Radii of the two spheres */
  radius1: number;
  radius2: number;
  /** Gap to external tangency (negative = transverse intersection) */
  tangencyGap: number;
  /** Normalized gap (0 = tangent, 1 = far from tangent) */
  normalizedGap: number;
  /** Whether spheres are currently tangent (within tolerance) */
  isTangent: boolean;
  /** Whether spheres intersect transversely */
  isTransverse: boolean;
}

/**
 * Compute the Cayley-Menger determinant for a set of points.
 * 
 * For k+1 points p₀, p₁, ..., pₖ, the CM determinant is:
 * 
 * CM = | 0    1    1    1   ...   1   |
 *      | 1    0   d₀₁²  d₀₂² ... d₀ₖ² |
 *      | 1   d₁₀²  0   d₁₂² ... d₁ₖ² |
 *      | ...                          |
 *      | 1   dₖ₀² dₖ₁² dₖ₂² ...  0   |
 * 
 * This is a (k+2) × (k+2) determinant.
 * 
 * @param points - Array of points, each as [x, y, z]
 * @returns The Cayley-Menger determinant
 */
export function computeCayleyMenger(points: number[][]): number {
  const k = points.length - 1; // k-simplex has k+1 vertices
  const n = k + 2; // Matrix is (k+2) × (k+2)

  if (points.length < 2) return 0;

  // Build the CM matrix
  const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

  // First row and column: 0 followed by 1s
  matrix[0][0] = 0;
  for (let i = 1; i < n; i++) {
    matrix[0][i] = 1;
    matrix[i][0] = 1;
  }

  // Fill in squared distances
  for (let i = 0; i < points.length; i++) {
    for (let j = 0; j < points.length; j++) {
      if (i === j) {
        matrix[i + 1][j + 1] = 0;
      } else {
        const d2 = squaredDistance(points[i], points[j]);
        matrix[i + 1][j + 1] = d2;
      }
    }
  }

  return determinant(matrix);
}

/**
 * Compute squared Euclidean distance between two points.
 */
function squaredDistance(p1: number[], p2: number[]): number {
  let sum = 0;
  for (let i = 0; i < Math.min(p1.length, p2.length); i++) {
    const diff = p1[i] - p2[i];
    sum += diff * diff;
  }
  return sum;
}

/**
 * Compute the determinant of a matrix using LU decomposition.
 */
function determinant(matrix: number[][]): number {
  const n = matrix.length;
  if (n === 0) return 0;
  if (n === 1) return matrix[0][0];
  if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];

  // Create a copy to avoid mutating
  const A = matrix.map(row => [...row]);

  let det = 1;
  let swaps = 0;

  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    let maxVal = Math.abs(A[i][i]);
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > maxVal) {
        maxVal = Math.abs(A[k][i]);
        maxRow = k;
      }
    }

    if (maxVal < 1e-12) {
      return 0; // Singular matrix
    }

    // Swap rows if needed
    if (maxRow !== i) {
      [A[i], A[maxRow]] = [A[maxRow], A[i]];
      swaps++;
    }

    det *= A[i][i];

    // Eliminate below
    for (let k = i + 1; k < n; k++) {
      const factor = A[k][i] / A[i][i];
      for (let j = i; j < n; j++) {
        A[k][j] -= factor * A[i][j];
      }
    }
  }

  return swaps % 2 === 0 ? det : -det;
}

/**
 * Compute the volume of a k-simplex from its Cayley-Menger determinant.
 * 
 * Vol_k² = (-1)^(k+1) / (2^k (k!)²) × CM
 * 
 * @param points - The k+1 vertices of the simplex
 * @returns The k-dimensional volume
 */
export function computeSimplexVolume(points: number[][]): number {
  const k = points.length - 1;
  if (k < 1) return 0;

  const cm = computeCayleyMenger(points);
  
  // Vol_k² = (-1)^(k+1) / (2^k × (k!)²) × CM
  const sign = (k + 1) % 2 === 0 ? 1 : -1;
  const factorial = factorialSquared(k);
  const denominator = Math.pow(2, k) * factorial;
  
  const volumeSquared = sign * cm / denominator;
  
  // Handle numerical issues
  if (volumeSquared < 0) {
    // This can happen due to numerical precision; volume should be non-negative
    return Math.sqrt(Math.abs(volumeSquared));
  }
  
  return Math.sqrt(volumeSquared);
}

/**
 * Compute k! squared.
 */
function factorialSquared(k: number): number {
  let result = 1;
  for (let i = 2; i <= k; i++) {
    result *= i * i;
  }
  return result;
}

/**
 * Compute the area of a triangle from 3 points.
 */
export function computeTriangleArea(p1: number[], p2: number[], p3: number[]): number {
  return computeSimplexVolume([p1, p2, p3]);
}

/**
 * Compute the volume of a tetrahedron from 4 points.
 */
export function computeTetrahedronVolume(
  p1: number[], p2: number[], p3: number[], p4: number[]
): number {
  return computeSimplexVolume([p1, p2, p3, p4]);
}

/**
 * Compute the affine dimension of a point set.
 * Returns 0 (single point), 1 (collinear), 2 (coplanar), or 3 (general position).
 */
export function computeAffineDimension(coords: Coordinates): number {
  const points = Object.values(coords);
  const n = points.length;

  if (n === 0) return 0;
  if (n === 1) return 0;
  if (n === 2) return 1; // Two distinct points are always collinear

  // Check for collinearity (all points on a line)
  // All triangles have zero area
  let allCollinear = true;
  for (let i = 0; i < n - 2 && allCollinear; i++) {
    for (let j = i + 1; j < n - 1 && allCollinear; j++) {
      for (let k = j + 1; k < n && allCollinear; k++) {
        const area = computeTriangleArea(points[i], points[j], points[k]);
        if (area > 1e-8) {
          allCollinear = false;
        }
      }
    }
  }
  if (allCollinear) return 1;

  // Check for coplanarity (all points on a plane)
  if (n < 4) return 2;
  
  let allCoplanar = true;
  for (let i = 0; i < n - 3 && allCoplanar; i++) {
    for (let j = i + 1; j < n - 2 && allCoplanar; j++) {
      for (let k = j + 1; k < n - 1 && allCoplanar; k++) {
        for (let l = k + 1; l < n && allCoplanar; l++) {
          const volume = computeTetrahedronVolume(
            points[i], points[j], points[k], points[l]
          );
          if (volume > 1e-8) {
            allCoplanar = false;
          }
        }
      }
    }
  }
  if (allCoplanar) return 2;

  return 3;
}

/**
 * Analyze Cayley-Menger volumes for a point configuration.
 * 
 * @param coords - Current vertex positions
 * @param initialCoords - Initial positions for progress tracking (optional)
 * @returns Complete volume analysis
 */
export function analyzeVolumes(
  coords: Coordinates,
  initialCoords?: Coordinates
): CMAnalysis {
  const labels = Object.keys(coords);
  const points = labels.map(label => coords[label]);
  const n = points.length;

  const currentDimension = computeAffineDimension(coords);

  // Compute collinearity determinant (for first 3 points)
  let collinearityDet = 0;
  let triangleArea = 0;
  if (n >= 3) {
    collinearityDet = computeCayleyMenger([points[0], points[1], points[2]]);
    triangleArea = computeTriangleArea(points[0], points[1], points[2]);
  }

  // Compute coplanarity determinant (for first 4 points)
  let coplanarityDet: number | null = null;
  let tetrahedronVolume: number | null = null;
  if (n >= 4) {
    coplanarityDet = computeCayleyMenger([points[0], points[1], points[2], points[3]]);
    tetrahedronVolume = computeTetrahedronVolume(
      points[0], points[1], points[2], points[3]
    );
  }

  // Max volume is the triangle area (2D) or tetrahedron volume (3D)
  const maxVolume = tetrahedronVolume ?? triangleArea;

  // Compute initial volume for progress tracking
  let initialVolume = maxVolume;
  if (initialCoords) {
    const initialPoints = labels.map(label => initialCoords[label]).filter(Boolean);
    if (initialPoints.length >= 4) {
      initialVolume = computeTetrahedronVolume(
        initialPoints[0], initialPoints[1], initialPoints[2], initialPoints[3]
      );
    } else if (initialPoints.length >= 3) {
      initialVolume = computeTriangleArea(
        initialPoints[0], initialPoints[1], initialPoints[2]
      );
    }
  }

  // Progress: 0 = initial volume, 1 = volume is 0
  const progress = initialVolume > 0 
    ? Math.max(0, Math.min(1, 1 - maxVolume / initialVolume))
    : (maxVolume < 1e-8 ? 1 : 0);

  return {
    currentDimension,
    collinearityDet,
    coplanarityDet,
    triangleArea,
    tetrahedronVolume,
    maxVolume,
    progress,
    initialVolume,
  };
}

/**
 * Compute the tangency gap for two spheres.
 * 
 * Tangency gap = |c₁ - c₂| - (r₁ + r₂)
 * - Negative: spheres intersect transversely (circle)
 * - Zero: spheres are tangent (single point)
 * - Positive: spheres are disjoint
 * 
 * @param c1 - Center of sphere 1
 * @param r1 - Radius of sphere 1
 * @param c2 - Center of sphere 2
 * @param r2 - Radius of sphere 2
 * @returns The tangency gap
 */
export function computeTangencyGap(
  c1: [number, number, number],
  r1: number,
  c2: [number, number, number],
  r2: number
): number {
  const dx = c2[0] - c1[0];
  const dy = c2[1] - c1[1];
  const dz = c2[2] - c1[2];
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  
  return distance - (r1 + r2);
}

/**
 * Analyze tangency information for constraint spheres in a graph.
 * 
 * For each node with 2+ neighbors, we have intersecting constraint spheres.
 * This function computes the tangency gap for each sphere pair.
 * 
 * @param coords - Current vertex positions
 * @param edgeLengths - Map of edge labels to their lengths
 * @param nodeNeighbors - Map of node labels to their neighbor labels
 * @returns Array of tangency information for each sphere pair
 */
export function analyzeTangency(
  coords: Coordinates,
  nodeNeighbors: { [label: string]: string[] }
): TangencyInfo[] {
  const results: TangencyInfo[] = [];

  for (const [nodeLabel, neighbors] of Object.entries(nodeNeighbors)) {
    if (neighbors.length < 2) continue;

    const nodePos = coords[nodeLabel];
    if (!nodePos) continue;

    // For each pair of neighbors, compute tangency gap
    for (let i = 0; i < neighbors.length - 1; i++) {
      for (let j = i + 1; j < neighbors.length; j++) {
        const neighbor1 = neighbors[i];
        const neighbor2 = neighbors[j];
        
        const pos1 = coords[neighbor1];
        const pos2 = coords[neighbor2];
        if (!pos1 || !pos2) continue;

        // Radii are distances from neighbors to the constrained node
        const r1 = Math.sqrt(squaredDistance(pos1, nodePos));
        const r2 = Math.sqrt(squaredDistance(pos2, nodePos));
        
        // Center distance
        const centerDist = Math.sqrt(squaredDistance(pos1, pos2));
        
        // Tangency gap
        const gap = computeTangencyGap(pos1, r1, pos2, r2);
        
        // Normalize: 0 at tangency, 1 when fully transverse (intersection circle radius = min(r1, r2))
        const maxGap = Math.min(r1, r2); // Approximate max transverse "depth"
        const normalizedGap = maxGap > 0 
          ? Math.max(0, Math.min(1, -gap / maxGap))
          : 0;

        results.push({
          sphere1Center: neighbor1,
          sphere2Center: neighbor2,
          constrainedNode: nodeLabel,
          centerDistance: centerDist,
          radius1: r1,
          radius2: r2,
          tangencyGap: gap,
          normalizedGap,
          isTangent: Math.abs(gap) < 0.01,
          isTransverse: gap < -0.01,
        });
      }
    }
  }

  return results;
}

/**
 * Get a color for a tangency gap value (for visualization).
 * 
 * - Transverse (gap < 0): Cyan
 * - Near-tangent: Orange
 * - Tangent (gap ≈ 0): Red
 * 
 * @param normalizedGap - Normalized tangency gap (0 = tangent, 1 = fully transverse)
 * @returns RGB color as [r, g, b] in 0-1 range
 */
export function getTangencyColor(normalizedGap: number): [number, number, number] {
  // Clamp to [0, 1]
  const t = Math.max(0, Math.min(1, normalizedGap));
  
  if (t > 0.7) {
    // Cyan (transverse)
    return [0, 1, 1];
  } else if (t > 0.3) {
    // Interpolate cyan to orange
    const s = (t - 0.3) / 0.4;
    return [1 - s, 0.65 + 0.35 * s, s];
  } else if (t > 0.05) {
    // Interpolate orange to red
    const s = (t - 0.05) / 0.25;
    return [1, 0.65 * s, 0];
  } else {
    // Red (tangent)
    return [1, 0, 0];
  }
}
