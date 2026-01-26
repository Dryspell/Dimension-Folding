# Worked Examples

> Concrete examples illustrating configuration spaces, rigidity, and dimension folding.

This document provides detailed worked examples that tie together the theory from the other mathematical documents.

---

## Table of Contents

- [1. P₃: The Path on 3 Vertices](#1-p₃-the-path-on-3-vertices)
- [2. K₃: The Triangle](#2-k₃-the-triangle)
- [3. K₄: The Tetrahedron](#3-k₄-the-tetrahedron)
- [4. C₄: The 4-Cycle](#4-c₄-the-4-cycle)
- [5. P₃ vs K₃: Flexibility Comparison](#5-p₃-vs-k₃-flexibility-comparison)

---

## 1. P₃: The Path on 3 Vertices

The path graph P₃ = ({v₁, v₂, v₃}, {{v₁,v₂}, {v₂,v₃}}) is the simplest flexible linkage and illustrates all key concepts.

### Structure

```
v₁ ——— v₂ ——— v₃
   L₁      L₂
```

- **Vertices**: 3
- **Edges**: 2 (with lengths L₁, L₂)
- **Constraints**: 2 distance equations

### Ambient Dimension

For 3 vertices, the generic ambient dimension is ℝ² (plane). However, we can study P₃ in any ℝᵈ with d ≥ 2.

### Full Configuration Space in ℝᵈ

With edge lengths L₁ = ‖v₁ - v₂‖ and L₂ = ‖v₂ - v₃‖:

```
C_d = { (v₁, v₂, v₃) ∈ ℝ^(3d) : ‖v₁-v₂‖ = L₁, ‖v₂-v₃‖ = L₂ }

dim(C_d) = 3d - 2
```

### Reduced Configuration Space

After quotienting by SE(d):

```
dim(C_d/SE(d)) = 3d - 2 - d(d+1)/2
```

| d | dim(C_d/SE(d)) | Notes |
|---|----------------|-------|
| 1 | 3(1) - 2 - 1 = 0 | Collinear configs are isolated points |
| 2 | 3(2) - 2 - 3 = 1 | 1D family of configurations |
| 3 | 3(3) - 2 - 6 = 1 | Same internal DOF as d=2 |
| d≥2 | 1 | The internal DOF stabilizes |

**Key observation**: The internal DOF is 1 for any d ≥ 2. The "extra" dimensions of ℝᵈ are absorbed by the larger rotation group.

### Explicit Parameterization

**Method 1: Hinge angle**

The internal parameter is θ = ∠v₁v₂v₃ (angle at the middle vertex).

Range: θ ∈ (0, π]

- θ → 0: v₁ and v₃ approach each other
- θ = π: v₁, v₂, v₃ collinear (dimension 1)

**Method 2: Endpoint distance**

The distance d₁₃ = ‖v₁ - v₃‖ parameterizes C/SE(d).

By the law of cosines:
```
d₁₃² = L₁² + L₂² - 2L₁L₂ cos(θ)
```

Range: d₁₃ ∈ [|L₁ - L₂|, L₁ + L₂]

### Topology

```
C/SE(d) ≅ [|L₁ - L₂|, L₁ + L₂]
```

The reduced configuration space is an **interval**. Boundary points are collinear configurations:
- d₁₃ = L₁ + L₂: v₂ between v₁ and v₃ (stretched)
- d₁₃ = |L₁ - L₂|: v₂ beyond one endpoint (folded)

### Fiber Bundle Structure

**Base space**: B = [d_min, d_max] = [|L₁-L₂|, L₁+L₂] (endpoint distance)

**Fiber over d**: 
- d ∈ (d_min, d_max): fiber ≅ S¹ (circle of valid v₂ positions)
- d = d_min or d_max: fiber ≅ {point} (tangent configuration)

```
                 Fiber (S¹)
                     ↑
    d_min ──────●═══════════════●────── d_max
              tangent       tangent
              (C₁)          (C₁)
```

### Sphere Intersection View

When v₁ and v₃ are fixed at distance d₁₃:

```
v₂ ∈ S^(d-1)(v₁, L₁) ∩ S^(d-1)(v₃, L₂)
```

- Transverse (d₁₃ in interior): intersection is S^(d-2)
- Tangent (d₁₃ at boundary): intersection is a point

**The intersection degenerates exactly when the configuration becomes collinear.**

### Cayley-Menger Characterization

The collinearity condition (dim = 1) for P₃ is CM(v₁,v₂,v₃) = 0, which expands to:

```
16 × Area² = 2L₁²L₂² + 2L₂²d₁₃² + 2d₁₃²L₁² - L₁⁴ - L₂⁴ - d₁₃⁴ = 0
```

With fixed L₁, L₂, this gives d₁₃ = L₁ + L₂ or d₁₃ = |L₁ - L₂|.

### Summary

| Property | Value |
|----------|-------|
| d_min(P₃) | 1 |
| Internal DOF | 1 |
| Flexible? | Yes |
| Can fold to line? | Yes |
| Topology of C/SE | Interval |

---

## 2. K₃: The Triangle

The complete graph K₃ = ({v₁, v₂, v₃}, {{v₁,v₂}, {v₂,v₃}, {v₁,v₃}}) is the simplest rigid structure.

### Structure

```
    v₁
   / \
  /   \
 v₂———v₃
```

- **Vertices**: 3
- **Edges**: 3
- **Constraints**: 3 distance equations

### Degrees of Freedom

| d | DOF = d(3) - 3 - d(d+1)/2 |
|---|---------------------------|
| 2 | 6 - 3 - 3 = 0 |
| 3 | 9 - 3 - 6 = 0 |

The triangle has **zero internal DOF** in both 2D and 3D—it is rigid.

### Configuration Space

For generic edge lengths (satisfying triangle inequality):
- C₂/SE(2) is a discrete set (two points: original and reflection)
- C₃/SE(3) is the same discrete set

### Minimal Dimension

**d_min(K₃) = 2**

A triangle cannot be embedded in dimension 1 (a line) while preserving all three edge lengths (unless the triangle inequality becomes an equality, which is non-generic).

### Rigidity Matrix

In 2D, the rigidity matrix is 3×6 with rank 3:

```
R = [ (x₁-x₂)  (y₁-y₂)  -(x₁-x₂)  -(y₁-y₂)   0        0      ]
    [ (x₂-x₃)  (y₂-y₃)     0        0      -(x₂-x₃) -(y₂-y₃) ]
    [ (x₁-x₃)  (y₁-y₃)     0        0      -(x₁-x₃) -(y₁-y₃) ]
```

Full rank indicates rigidity.

### Matroid Structure

The three edges form a **circuit** in the 2D rigidity matroid:
- Any two edges are independent (form a basis)
- The third edge is dependent (can be derived from the other two given positions)
- Removing any one edge leaves a minimally rigid structure

### Summary

| Property | Value |
|----------|-------|
| d_min(K₃) | 2 |
| Internal DOF | 0 |
| Flexible? | No |
| Can fold to line? | No |

---

## 3. K₄: The Tetrahedron

The complete graph K₄ on 4 vertices forms a tetrahedron in 3D.

### Structure

- **Vertices**: 4
- **Edges**: 6
- **Constraints**: 6 distance equations

### Degrees of Freedom

| d | DOF = d(4) - 6 - d(d+1)/2 |
|---|---------------------------|
| 2 | 8 - 6 - 3 = -1 ❌ |
| 3 | 12 - 6 - 6 = 0 |

K₄ is **over-constrained** in 2D (cannot generically exist) but **rigid** in 3D.

### Minimal Dimension

**d_min(K₄) = 3**

A tetrahedron cannot be flattened to a plane while preserving all six edge lengths (generically).

### Configuration Space

For generic edge lengths:
- C₂ = ∅ (no 2D realization exists)
- C₃/SE(3) is discrete (typically 8 points: 2³ from reflection choices)

### Suspension Structure

K₄ = Σ(K₃) (suspension of triangle)

Since d_min(K₃) = 2, we have d_min(K₄) = 3.

### Cayley-Menger Test

For 4 points to be coplanar:
```
CM(v₁,v₂,v₃,v₄) = 0
```

For a generic tetrahedron, CM ≠ 0, confirming it spans 3D.

### Summary

| Property | Value |
|----------|-------|
| d_min(K₄) | 3 |
| Internal DOF (3D) | 0 |
| Flexible? | No |
| Can flatten to plane? | No (generically) |

---

## 4. C₄: The 4-Cycle

The cycle graph C₄ is a flexible quadrilateral.

### Structure

```
v₁ ——— v₂
|       |
|       |
v₄ ——— v₃
```

- **Vertices**: 4
- **Edges**: 4
- **Constraints**: 4 distance equations

### Degrees of Freedom

| d | DOF = d(4) - 4 - d(d+1)/2 |
|---|---------------------------|
| 2 | 8 - 4 - 3 = 1 |
| 3 | 12 - 4 - 6 = 2 |

The 4-cycle has **1 internal DOF in 2D** and **2 in 3D**.

### Flexibility

C₄ is famous for being flexible—it can deform from a square to a rhombus while preserving edge lengths. The internal DOF represents this "shearing" motion.

### Minimal Dimension

**d_min(C₄) = 2**

The 4-cycle cannot be fully collapsed to a line (generically), because:
- Collinearity would require d₁₃ = L₁₂ + L₂₃ or similar
- But the opposite edge constraint (v₁-v₄-v₃) may conflict

However, it can be flattened to a plane.

### Configuration Space Topology

The reduced configuration space C₄/SE(2) is topologically a **circle** (for generic edge lengths):
- Each point on the circle represents a different "shear" of the quadrilateral
- Two special points may correspond to degenerate (collinear triplet) configurations

### Summary

| Property | Value |
|----------|-------|
| d_min(C₄) | 2 |
| Internal DOF (2D) | 1 |
| Flexible? | Yes |
| Topology of C/SE | Circle (S¹) |

---

## 5. P₃ vs K₃: Flexibility Comparison

This comparison highlights the difference between flexible and rigid structures.

### Side-by-Side Comparison

| Property | P₃ (Path) | K₃ (Triangle) |
|----------|-----------|---------------|
| Vertices | 3 | 3 |
| Edges | 2 | 3 |
| Internal DOF (2D) | 1 | 0 |
| Internal DOF (3D) | 1 | 0 |
| Flexible? | Yes | No |
| d_min | 1 | 2 |
| Can fold to line? | Yes | No |
| Contains circuit? | No | Yes (in 2D matroid) |
| Rigidity matrix rank | 2 (deficient) | 3 (full) |

### Why P₃ is Flexible

The path has only 2 constraints for 3 vertices. In the rigidity matroid:
- Both edges are independent
- No circuits exist
- The rank deficiency in the rigidity matrix indicates a degree of freedom
- This DOF allows folding to collinearity

### Why K₃ is Rigid

The triangle has 3 constraints for 3 vertices. In 2D:
- The three edges form a circuit
- Any two edges form a basis (sufficient for rigidity)
- The third edge is algebraically dependent on the first two
- Full rank means no internal motion

### Motion Existence Proof (P₃)

To show P₃ can fold to dimension 1:

1. **Rigidity matrix analysis**: Rank is 2 < 3, indicating flexibility
2. **Null space**: The kernel of R contains non-trivial velocity vectors
3. **Interpretation**: These velocities describe motions preserving edge lengths
4. **Result**: One such motion brings v₂ onto line(v₁, v₃)

This motion exists **without computing it explicitly**—the matroid structure guarantees it.

### Circuit Obstruction (K₃)

To show K₃ cannot fold to dimension 1:

1. **Collinearity requirement**: All three points on a line means d₁₃ = d₁₂ ± d₂₃
2. **Constraint conflict**: Edge (1-3) has fixed length L₁₃
3. **Triangle inequality**: L₁₃ < L₁₂ + L₂₃ (strict for non-degenerate)
4. **Conclusion**: Cannot achieve collinearity while preserving all edges

---

## Key Takeaways

1. **DOF = 0 ⟹ Rigid**: Zero internal degrees of freedom means no non-trivial motion.

2. **Circuits obstruct folding**: A circuit in the rigidity matroid prevents dimensional reduction.

3. **Flexibility enables folding**: Positive DOF implies motions exist; these may reduce dimension.

4. **Graph structure determines d_min**: The combinatorial minimal dimension depends only on the graph, not edge lengths.

5. **Matroid analysis is powerful**: We can prove motion existence without computing explicit paths.

---

*This document is part of the Dimension Folding project. See [../MATH.md](../MATH.md) for an overview.*
