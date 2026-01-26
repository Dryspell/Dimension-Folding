# Sphere Intersections and Tangency

> Each vertex in a linkage lies at the intersection of spheres centered at its neighbors. The geometry of these intersections determines the configuration space.

This document covers the sphere intersection geometry underlying linkage constraints, the tangency-dimension connection, and visualization implications.

---

## Table of Contents

- [1. Per-Vertex Sphere Intersections](#1-per-vertex-sphere-intersections)
- [2. Sphere Intersection Classification](#2-sphere-intersection-classification)
- [3. The Tangency-Dimension Theorem](#3-the-tangency-dimension-theorem)
- [4. Intersection Geometry in 3D](#4-intersection-geometry-in-3d)
- [5. Visualization Implications](#5-visualization-implications)

---

## 1. Per-Vertex Sphere Intersections

### Local Configuration Space

For each vertex v in a linkage, given fixed positions of its neighbors N(v), the valid positions for v form:

```
Config(v | neighbors fixed) = ⋂_{u ∈ N(v)} S²(p(u), L({v,u}))
```

where S²(c, r) denotes the 2-sphere centered at c with radius r.

Each edge constraint defines a sphere:
- **Center**: Position of the neighboring vertex
- **Radius**: The prescribed edge length

### Intersection Dimensions in ℝ³

For k spheres in generic position in ℝ³:

| k (# spheres) | Generic Intersection | Dimension |
|---------------|---------------------|-----------|
| 1 | S² (sphere) | 2 |
| 2 | S¹ (circle) | 1 |
| 3 | {p₁, p₂} (two points) | 0 |
| 4 or more | ∅ or finite points | 0 or empty |

### Vertex Degree and Constraint

The degree (number of neighbors) of a vertex determines its local constraint:

| deg(v) | Local Configuration Space | Description |
|--------|---------------------------|-------------|
| 0 | ℝ³ | Free (unconstrained) |
| 1 | S² | On a sphere |
| 2 | S¹ (generically) | On a circle |
| 3 | Finite points | Discrete options |
| ≥4 | Empty (generically) | Over-constrained |

---

## 2. Sphere Intersection Classification

### Two-Sphere Intersection

For two spheres S₁ = S²(c₁, r₁) and S₂ = S²(c₂, r₂) with center distance d = ‖c₁ - c₂‖:

```
Intersection type:
  d > r₁ + r₂             → ∅ (disjoint, external)
  d = r₁ + r₂             → {point} (external tangent)
  |r₁ - r₂| < d < r₁ + r₂ → S¹ (transverse, circle)
  d = |r₁ - r₂|           → {point} (internal tangent)
  d < |r₁ - r₂|           → ∅ (disjoint, one inside other)
```

### The Tangency Locus

The **tangency locus** T ⊂ C is the set of configurations where at least one pair of constraint spheres is tangent rather than transverse.

**Key principle**: Tangency corresponds to **dimension reduction** of the intersection.

### Circle Radius Formula

For two spheres with radii r₁, r₂ and centers at distance d, the intersection circle has:

```
radius = (1/2d)√[(r₁+r₂+d)(r₁+r₂-d)(d+r₁-r₂)(d-r₁+r₂)]
```

This radius goes to 0 as:
- d → r₁ + r₂ (external tangency)
- d → |r₁ - r₂| (internal tangency)

### Three-Sphere Intersection

For three spheres in ℝ³:
- **Generic case**: 0, 1, or 2 isolated points
- **Special case**: Empty (incompatible constraints)
- **Degenerate case**: Circle (all three share a common circle)

The intersection of three spheres can be computed by:
1. Find the circle from first two spheres
2. Intersect that circle with the third sphere
3. Result: 0, 1, or 2 points

---

## 3. The Tangency-Dimension Theorem

### The Core Principle

**Sphere tangency ⟺ dimension reduction**

When constraint spheres transition from transverse intersection to tangent intersection, the affine dimension of the configuration decreases.

### Statement (General Form)

**Theorem**: For a linkage with n vertices in ℝᵈ, a configuration p has dim(p) ≤ k if and only if certain sphere intersections degenerate to tangency conditions.

More precisely:
- **Transverse intersection** (generic): spheres meet in a (d-2)-sphere → configuration has "room to move"
- **Tangent intersection** (special): spheres meet at a point → configuration is constrained to lower dimension

### Theorem (Path Graphs)

For a path graph Pₙ with vertices v₁ — v₂ — ⋯ — vₙ:

```
dim(p) = 1  ⟺  every consecutive sphere pair is tangent
```

### Proof for P₃

**Setup**: 
- S₁ = S^(d-1)(v₁, L₁) (sphere of radius L₁ centered at v₁)
- S₂ = S^(d-1)(v₃, L₂) (sphere of radius L₂ centered at v₃)
- Constraint: v₂ ∈ S₁ ∩ S₂

**Forward (dim = 1 ⟹ tangent)**:
- If v₁, v₂, v₃ are collinear, then v₂ lies on the line through v₁ and v₃
- Distance ‖v₁ - v₃‖ equals L₁ + L₂ or |L₁ - L₂|
- In either case, S₁ and S₂ are tangent at v₂

**Backward (tangent ⟹ dim = 1)**:
- If S₁ and S₂ are tangent, their intersection is a single point
- This point lies on the line connecting sphere centers
- Therefore v₂ is on line(v₁, v₃), giving dim = 1 ∎

### Generalization to Coplanarity

For 4 vertices in a linkage, coplanarity (dim ≤ 2) corresponds to a **weaker tangency condition**:

The constraint spheres need not be pairwise tangent, but their mutual intersection must be "degenerate" in the sense that all points lie in a common plane.

**Cayley-Menger formulation**: dim(p) ≤ 2 iff CM(v₁,v₂,v₃,v₄) = 0.

### Tangency Equations

For two spheres S^(d-1)(c₁, r₁) and S^(d-1)(c₂, r₂):

| Condition | Equation | Meaning |
|-----------|----------|---------|
| External tangency | ‖c₁-c₂‖ = r₁+r₂ | Touching outside |
| Internal tangency | ‖c₁-c₂‖ = \|r₁-r₂\| | One inside other, touching |
| Transverse | \|r₁-r₂\| < ‖c₁-c₂‖ < r₁+r₂ | Circle intersection |

### Volume Connection

The Cayley-Menger determinant measures the "volume" that vanishes at tangency:

```
CM → 0  ⟺  dimension drops  ⟺  spheres become tangent
```

This unifies the algebraic (CM) and geometric (tangency) perspectives.

---

## 4. Intersection Geometry in 3D

### Computing Circle of Intersection

For two spheres with centers c₁, c₂ (at distance d) and radii r₁, r₂:

**Circle center** (on line c₁c₂):
```
t = (d² + r₁² - r₂²) / (2d²)
center = c₁ + t(c₂ - c₁)
```

**Circle radius**:
```
r = √(r₁² - t²d²)
```

**Circle plane normal**:
```
n = (c₂ - c₁) / d
```

### Implementation Notes

When implementing sphere intersection:

1. **Check feasibility first**: Verify |r₁ - r₂| ≤ d ≤ r₁ + r₂
2. **Handle tangent cases**: When d ≈ r₁ + r₂ or d ≈ |r₁ - r₂|, the circle degenerates to a point
3. **Numerical precision**: Use tolerances for tangency detection

### Three-Sphere Intersection Algorithm

```
function intersectThreeSpheres(c₁, r₁, c₂, r₂, c₃, r₃):
    // Step 1: Find circle from first two spheres
    circle = intersectTwoSpheres(c₁, r₁, c₂, r₂)
    if circle is empty: return empty
    if circle is point: 
        // Check if point satisfies third sphere
        if |point - c₃| ≈ r₃: return {point}
        else: return empty
    
    // Step 2: Intersect circle with third sphere
    // Circle lies in plane with normal n, center p, radius r
    // Solve: |x - c₃|² = r₃² subject to (x - p)·n = 0, |x - p|² = r²
    
    // Project c₃ onto circle plane
    proj = c₃ - ((c₃ - p)·n) n
    h = |proj - c₃|  // height above plane
    
    // Distance from circle center to intersection chord
    d_chord = |proj - p|
    
    // Use law of cosines in 3D
    // Returns 0, 1, or 2 points
```

---

## 5. Visualization Implications

### What to Display

#### 1. The Tangency Gap

For each pair of constraint spheres, display:
```
gap = ‖c₁ - c₂‖ - (r₁ + r₂)    [for external tangency]
```

- gap > 0: disjoint (infeasible)
- gap = 0: tangent (collinear configuration)
- gap < 0: transverse intersection (circle exists)

#### 2. Intersection Circle Radius

Show the radius of constraint circles:
```
r_circle = (1/2d)√[(r₁+r₂+d)(r₁+r₂-d)(d+r₁-r₂)(d-r₁+r₂)]
```

This approaches 0 as tangency is approached.

#### 3. Position in Reduced Configuration Space

For P₃, show the current position in [d_min, d_max]:
```
normalized_position = (d - d_min) / (d_max - d_min) ∈ [0,1]
```

Boundary values (0 and 1) correspond to collinear configurations.

### Color Coding Suggestions

| Element | Color | Meaning |
|---------|-------|---------|
| Transverse circle | Cyan | Generic configuration, full DOF |
| Near-tangent circle | Yellow→Orange | Approaching lower dimension |
| Tangent point | Red | Minimal dimension achieved |
| Constraint spheres | Blue wireframe | Edge length constraints |
| Generic config | Green tint | Full-dimensional embedding |
| Degenerate config | Red tint | Lower-dimensional embedding |

### Sphere Rendering Options

1. **Wireframe spheres**: Show constraint surfaces without obscuring nodes
2. **Transparent spheres**: Opacity proportional to relevance
3. **Intersection circles**: Highlight where constraints meet
4. **Intersection points**: Mark discrete solutions for 3+ spheres

---

## Connection to Other Topics

- **Cayley-Menger Determinants**: Algebraic detection of tangency. See [CAYLEY-MENGER.md](./CAYLEY-MENGER.md).
- **Configuration Spaces**: Spheres define the variety. See [CONFIGURATION-SPACES.md](./CONFIGURATION-SPACES.md).
- **Algebraic Geometry**: Spheres as quadric hypersurfaces. See [ALGEBRAIC-GEOMETRY.md](./ALGEBRAIC-GEOMETRY.md).

---

*This document is part of the Dimension Folding project. See [../MATH.md](../MATH.md) for an overview.*
