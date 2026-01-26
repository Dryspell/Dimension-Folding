# Configuration Spaces

> The configuration space of a linkage encodes all possible positions of its vertices that satisfy edge length constraints.

This document covers the foundational theory of configuration spaces for linkages, including ambient dimension, genericity, degrees of freedom, and the algebraic variety structure.

---

## Table of Contents

- [1. Ambient Dimension and Genericity](#1-ambient-dimension-and-genericity)
- [2. Configuration Space as Algebraic Variety](#2-configuration-space-as-algebraic-variety)
- [3. Codimension and Constraint Counting](#3-codimension-and-constraint-counting)
- [4. The Dimension Stratification](#4-the-dimension-stratification)
- [5. Worked Example: 6 Points in ℝ³](#5-worked-example-6-points-in-ℝ³)

---

## 1. Ambient Dimension and Genericity

### The Genericity Principle

For n vertices in Euclidean space, the natural question is: what is the appropriate ambient dimension?

**Key insight**: n points in **general position** span an (n-1)-dimensional affine subspace. Therefore:

```
For n vertices, the generic ambient space is ℝ^(n-1)
```

This is the minimal dimension where n points can be "spread out" as much as possible.

### Why ℝ^(n-1)?

| n vertices | Generic affine span | Example |
|------------|---------------------|---------|
| 2 | 1D (line) | Two points determine a line |
| 3 | 2D (plane) | Three non-collinear points span a plane |
| 4 | 3D (space) | Four non-coplanar points span 3-space |
| n | (n-1)D | n points in general position span (n-1)-space |

### General Position

Points p₁, ..., pₙ ∈ ℝᵈ are in **general position** if:
- No unnecessary affine dependencies exist
- The affine hull has dimension min(n-1, d)
- Equivalently: the matrix [p₂-p₁ | p₃-p₁ | ... | pₙ-p₁] has rank min(n-1, d)

### Implications for Linkages

For a linkage with n vertices:

1. **Natural embedding**: ℝ^(n-1) is the "right" ambient space for generic configurations
2. **Dimension folding**: Moving from ℝ^(n-1) to ℝ^k for k < n-1 represents "folding"
3. **Minimal dimension**: The goal is to find the smallest k such that the linkage can be realized in ℝ^k

### Rigid Motions in ℝᵈ

The group of rigid motions in ℝᵈ is SE(d) = ℝᵈ ⋊ SO(d):

| Component | Dimension | Description |
|-----------|-----------|-------------|
| Translations | d | Moving in each coordinate direction |
| Rotations | d(d-1)/2 | Independent rotation planes |
| **Total** | **d(d+1)/2** | **Trivial degrees of freedom** |

| d | Trivial DOF |
|---|-------------|
| 1 | 1 (translation only) |
| 2 | 3 (2 translations + 1 rotation) |
| 3 | 6 (3 translations + 3 rotations) |
| 4 | 10 (4 translations + 6 rotations) |
| d | d(d+1)/2 |

---

## 2. Configuration Space as Algebraic Variety

### Definition

The **configuration space** of a graph G = (V, E) with edge length function L: E → ℝ⁺ in ambient dimension d is:

```
C_d(G, L) = { p: V → ℝᵈ | ‖p(u) - p(v)‖² = L(e)² for all e = {u,v} ∈ E }
```

This is a **real algebraic variety**—the intersection of |E| quadric hypersurfaces in ℝ^(d|V|).

**Note**: We write C_d to emphasize the ambient dimension. When d = n-1 (generic), we may write simply C.

### Dimension Formula

**Generic dimension in ℝᵈ:**

```
dim(C_d) = d|V| - |E|
```

This assumes edges impose independent constraints.

**Reduced configuration space:**

Quotienting by rigid motions SE(d):

```
dim(C_d/SE(d)) = d|V| - |E| - d(d+1)/2
```

This is the **internal degrees of freedom** (internal DOF) in dimension d.

### Dimension Constraints

For a non-empty configuration space:
- Need: d|V| - |E| ≥ d(d+1)/2 (enough room for trivial motions)
- Equivalently: |E| ≤ d|V| - d(d+1)/2

For **minimal rigidity** in ℝᵈ:
```
|E| = d|V| - d(d+1)/2
```

### Examples of Internal DOF

| Graph | |V| | |E| | d=2 DOF | d=3 DOF |
|-------|-----|-----|---------|---------|
| P₃ (path) | 3 | 2 | 2(3)-2-3 = 1 | 3(3)-2-6 = 1 |
| K₃ (triangle) | 3 | 3 | 2(3)-3-3 = 0 | 3(3)-3-6 = 0 |
| C₄ (4-cycle) | 4 | 4 | 2(4)-4-3 = 1 | 3(4)-4-6 = 2 |
| K₄ (complete) | 4 | 6 | 2(4)-6-3 = -1 ❌ | 3(4)-6-6 = 0 |

---

## 3. Codimension and Constraint Counting

### What is Codimension?

The **codimension** of a submanifold is the difference between the dimension of the ambient space and the dimension of the submanifold:

```
codim(M) = dim(ambient) - dim(M)
```

A **codimension-1 subvariety** (hypersurface) in n-dimensional space has dimension n-1.

### Edge Constraints as Codimension-1 Spheres

Each edge constraint in a linkage generates a **sphere of codimension 1**:

For an edge e = {u, v} with length L, fixing u's position, the constraint on v is:

```
‖p(v) - p(u)‖² = L²
```

This defines a sphere S^(d-1) in ℝᵈ centered at p(u) with radius L.

**Key properties:**
- A sphere in n-dimensional space is an (n-1)-dimensional manifold
- Its codimension is n - (n-1) = 1
- Each edge constraint removes **one degree of freedom**

### Intersecting Codimension-1 Constraints

When multiple edge constraints are applied, their intersection determines the configuration space:

| # of Independent Constraints | Expected Dimension |
|------------------------------|-------------------|
| 0 | n (full space) |
| 1 | n - 1 (hypersurface) |
| 2 | n - 2 |
| k | n - k |
| n | 0 (discrete points) |

**Critical assumption**: Constraints must be **independent** (in general position) for this dimension counting to hold.

### When Constraints are Dependent

Constraints can fail to be independent in several ways:

1. **Algebraic dependency**: Some constraints are implied by others
   - Example: In a triangle, knowing two edge lengths and the angle determines the third edge
   
2. **Geometric alignment**: Constraints restrict the same directions
   - Example: Collinear constraints don't reduce dimension as expected
   
3. **Over-constrained systems**: More constraints than degrees of freedom
   - Example: K₄ in ℝ² has 6 constraints but only 5 available DOF

### Example: From ℝ¹⁸ to Dimension 0

Consider 6 points in configuration space:

1. **Full space**: ℝ^(3×6) = ℝ¹⁸
2. **Quotient by SE(3)**: 18 - 6 = 12 dimensions (reduced configuration space)
3. **Apply 12 independent codimension-1 constraints**: 12 - 12 = 0

**Result**: If 12 constraints are independent, the variety has dimension 0 (discrete points).

**But**: If constraints are dependent, dimension > 0 persists. This happens when:
- The graph structure creates redundant constraints (circuits in the rigidity matroid)
- The edge lengths satisfy special algebraic relations
- Symmetric configurations satisfy multiple constraints simultaneously

### Why This Matters for Dimension Folding

The codimension perspective explains:

1. **Why some graphs are rigid**: Enough independent codimension-1 constraints reduce DOF to 0
2. **Why some graphs are flexible**: Too few constraints leave positive DOF
3. **Why dimension reduction is possible**: Flexibility allows motion toward tangency
4. **What tangency means**: Two spheres becoming tangent means their intersection drops from codimension-2 to a point

---

## 4. The Dimension Stratification

### The Affine Dimension Function

For n vertices with positions p: V → ℝᵈ, define:

```
dim(p) = dimension of affine hull of {p(v) : v ∈ V}
```

The **affine hull** is the smallest affine subspace containing all vertex positions.

**Range**: dim(p) ∈ {0, 1, 2, ..., min(n-1, d)}

### Computing Affine Dimension

The affine dimension equals the rank of the position difference matrix:

```
dim(p) = rank([p(v₂)-p(v₁) | p(v₃)-p(v₁) | ... | p(vₙ)-p(v₁)])
```

### Dimension Strata

For a configuration space C in ambient dimension d, define the **k-stratum**:

```
C^(k) = { p ∈ C : dim(p) ≤ k }
```

These form a nested filtration:

```
C^(0) ⊂ C^(1) ⊂ C^(2) ⊂ ... ⊂ C^(n-1) = C
```

### Interpretation

| Stratum | Geometric Meaning | Example |
|---------|-------------------|---------|
| C^(0) | All vertices coincide | Single point (degenerate) |
| C^(1) | All vertices collinear | On a line |
| C^(2) | All vertices coplanar | In a plane |
| C^(k) | In a k-dimensional flat | In a k-flat |

### The Minimal Dimension

The **minimal embedding dimension** of a linkage from configuration p is:

```
dim_min(p) = min{ k : ∃ path γ:[0,1]→C with γ(0)=p, dim(γ(1))=k, and C^(k-1) unreachable }
```

This is the key quantity we seek to compute and visualize.

---

## 5. Worked Example: 6 Points in ℝ³

This example illustrates the dimensional analysis for a complete graph K₆.

### Setup

- **Vertices**: 6 points in ℝ³
- **Total configuration space**: ℝ^(3×6) = ℝ¹⁸ (each point has 3 coordinates)
- **Edges in K₆**: 6×5/2 = 15 edges

### Counting Degrees of Freedom

**Full configuration space dimension:**
```
dim(C₃) = 3(6) - 15 = 18 - 15 = 3
```

**Rigid motions in ℝ³:**
- Translations: 3 degrees of freedom
- Rotations: 3 degrees of freedom  
- Total SE(3): 6 degrees of freedom

**Reduced configuration space:**
```
dim(C₃/SE(3)) = 3 - 6 = -3 ❌
```

This negative value indicates K₆ is **over-constrained** in ℝ³—there are more constraints than can be generically satisfied.

### Interpretation

For 6 generic points in ℝ³:
- The 15 edge constraints impose **dependent** conditions
- Not all edge lengths can be independently chosen
- The configuration space may be empty for generic edge lengths
- Only special edge lengths (derived from actual 3D configurations) yield non-empty C

### What Ambient Dimension is Needed?

For K₆ to be minimally rigid (DOF = 0):
```
d(6) - 15 - d(d+1)/2 = 0
```

Solving: need d = 5, since:
- d=5: 5(6) - 15 - 5(6)/2 = 30 - 15 - 15 = 0 ✓

This confirms that K₆ has combinatorial minimal dimension d_min(K₆) = 5.

### Constraints and Dependencies

In general, for n points in ℝᵈ with m edge constraints:

1. **Configuration space dimension**: nd - m (before quotienting)
2. **After quotienting by SE(d)**: nd - m - d(d+1)/2
3. **Constraint independence**: Holds when m ≤ nd - d(d+1)/2

When constraints are **dependent** (m too large for the dimension), some constraints are redundant—they're implied by others. This is precisely what the **rigidity matroid** captures.

---

## Connection to Other Topics

- **Algebraic Geometry**: Configuration spaces are real algebraic varieties. See [ALGEBRAIC-GEOMETRY.md](./ALGEBRAIC-GEOMETRY.md).
- **Rigidity Matroids**: Constraint independence is captured by matroid structure. See [RIGIDITY-MATROIDS.md](./RIGIDITY-MATROIDS.md).
- **Cayley-Menger**: Dimension can be characterized via determinants. See [CAYLEY-MENGER.md](./CAYLEY-MENGER.md).

---

*This document is part of the Dimension Folding project. See [../MATH.md](../MATH.md) for an overview.*
