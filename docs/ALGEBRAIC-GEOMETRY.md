# Algebraic Geometry of Configuration Spaces

> This document develops the algebraic-geometric perspective on linkage configuration spaces, complementing the combinatorial (matroid) and metric (Cayley-Menger) approaches in [MATH.md](../MATH.md).

---

## Table of Contents

- [1. Configuration Spaces as Algebraic Varieties](#1-configuration-spaces-as-algebraic-varieties)
- [2. Hypersurface Intersections and Dimension](#2-hypersurface-intersections-and-dimension)
- [3. Smooth and Singular Points](#3-smooth-and-singular-points)
- [4. Quotient Spaces and Reduced Configuration](#4-quotient-spaces-and-reduced-configuration)
- [5. Constraint Independence and the Rigidity Matroid](#5-constraint-independence-and-the-rigidity-matroid)
- [6. Special Configurations and Stratification](#6-special-configurations-and-stratification)
- [7. Connections to Distance Geometry](#7-connections-to-distance-geometry)

---

## 1. Configuration Spaces as Algebraic Varieties

### The Variety Structure

The configuration space of a linkage is a **real algebraic variety**. For a graph G = (V, E) with n = |V| vertices and m = |E| edges, with prescribed edge lengths L: E → ℝ⁺, the configuration space is:

```
C(G, L) = { p ∈ (ℝᵈ)ⁿ : ‖p(u) - p(v)‖² = L(e)² for all e = {u,v} ∈ E }
```

Each edge constraint defines a **codimension-1 subvariety** (hypersurface) in the ambient space ℝ^(dn).

### Polynomial Equations

Each edge constraint is a quadratic polynomial:

```
f_e(p) = Σᵢ (pᵤᵢ - pᵥᵢ)² - L(e)² = 0
```

The configuration space is the zero locus of these polynomials:

```
C(G, L) = V(f_{e₁}, f_{e₂}, ..., f_{eₘ}) ⊂ ℝ^(dn)
```

### Real vs. Complex

We work over ℝ (real algebraic geometry), which introduces subtleties:

- Varieties may be empty (edge lengths incompatible)
- Varieties may be disconnected
- Singularities may occur at real points

Over ℂ, the theory is cleaner (algebraically closed field), but we care about real realizations.

---

## 2. Hypersurface Intersections and Dimension

### Codimension and Dimension

In ℝⁿ, a **hypersurface** (codimension-1 subvariety) is defined by a single polynomial equation and has dimension n-1.

**General position theorem**: The intersection of k hypersurfaces in ℝⁿ generically has dimension n-k (assuming k ≤ n).

### Applied to Configuration Spaces

For n vertices in ℝᵈ:
- Ambient space: ℝ^(dn)
- Number of constraints: m (edges)
- Expected dimension: dn - m

**Example**: K₄ in ℝ³
- Ambient: ℝ¹² (4 vertices × 3 coordinates)
- Constraints: 6 edges
- Expected dimension: 12 - 6 = 6

After quotienting by SE(3) (6-dimensional):
- Reduced dimension: 6 - 6 = 0

The configuration space is discrete (rigid).

### When Dimension Differs from Expected

The actual dimension may exceed dn - m if:

1. **Constraint dependencies**: Some edge constraints are algebraically dependent
2. **Special edge lengths**: Particular values allowing unexpected solutions
3. **Symmetric configurations**: High symmetry reducing effective constraints

This is precisely the **rigidity matroid** perspective: constraint independence determines dimension.

---

## 3. Smooth and Singular Points

### Smooth (Nonsingular) Varieties

A variety V is **smooth** (or nonsingular) at point p if the dimension of the tangent space T_p(V) equals the dimension of V.

**Definition**: A point p on variety V = V(f₁, ..., fₘ) ⊂ ℝⁿ is smooth if the Jacobian matrix:

```
J = [∂fᵢ/∂xⱼ]
```

has rank exactly n - dim(V) at p.

### Smooth Configuration Spaces

For generic edge lengths, configuration spaces of flexible linkages are typically smooth manifolds.

**Theorem**: If p is a smooth point of C(G, L), then the configuration space is locally a manifold of dimension:

```
dim_p(C) = dn - rank(R_p)
```

where R_p is the rigidity matrix at configuration p.

### Singular Points

Singularities occur where:
- The tangent space has higher dimension than expected
- Multiple components of the variety meet
- The variety has "cusps" or "self-intersections"

**In configuration spaces**, singularities often correspond to:
1. **Bifurcation points**: Where folding paths branch
2. **Degenerate configurations**: Vertices coinciding or becoming collinear
3. **Flexion points**: Where rigidity changes

### The Cone Example

The quotient of ℝ³ by spheres (collapsing each sphere to a point) yields a **cone over S²**:

```
ℝ³ / {spheres} ≅ C(S²)
```

The apex of the cone is a **singular point** (the origin). This illustrates how quotient operations can introduce singularities.

---

## 4. Quotient Spaces and Reduced Configuration

### The Action of SE(d)

The rigid motion group SE(d) = ℝᵈ ⋊ SO(d) acts on configuration space by:

```
(t, R) · p = (Rp(v₁) + t, Rp(v₂) + t, ..., Rp(vₙ) + t)
```

This action has dimension d(d+1)/2:
- d translations
- d(d-1)/2 rotations

### The Quotient Space

The **reduced configuration space** is:

```
C̃ = C / SE(d)
```

**Dimension**:
```
dim(C̃) = dim(C) - d(d+1)/2 = dn - m - d(d+1)/2
```

(assuming the action is free, i.e., no fixed points)

### When the Action Is Not Free

The SE(d) action has fixed points when the configuration has symmetry:

- **Collinear configurations**: Rotation around the line is not free
- **Coincident points**: Extra translation freedom

At such points, the quotient may have singularities.

### Orbit Types

Different configurations have different **isotropy groups** (stabilizers):

| Configuration Type | Isotropy Group | Orbit Dimension |
|--------------------|----------------|-----------------|
| Generic (d ≥ 3) | Trivial | d(d+1)/2 |
| Collinear | O(d-1) | d + (d-1)(d-2)/2 |
| Coincident | SE(d) | 0 |

---

## 5. Constraint Independence and the Rigidity Matroid

### Algebraic Independence

Constraints {f₁, ..., fₘ} are **algebraically independent** at p if their gradients are linearly independent:

```
∇f₁(p), ∇f₂(p), ..., ∇fₘ(p) are linearly independent
```

This is equivalent to the rigidity matrix having full row rank.

### The Rigidity Matrix

For a configuration p: V → ℝᵈ, the **rigidity matrix** R(p) is the Jacobian of the edge constraint functions:

```
R(p) = [∂f_e/∂p(v)ᵢ]_{e ∈ E, (v,i) ∈ V × [d]}
```

**Dimension formula**:
```
dim_p(C) = dn - rank(R(p))
```

### Matroid Structure

The **rigidity matroid** R_d(G) has:
- Ground set: E (edges)
- Independent sets: Edge sets where corresponding rows of R(p) are independent (for generic p)

**Key property**: The rank function of R_d(G) determines generic dimension:

```
dim(C/SE(d)) = dn - rank(R_d(G)) - d(d+1)/2
```

### Dependencies Create Flexibility

When edge constraints are dependent:
- The variety has higher dimension than expected
- The linkage is **flexible** (has internal degrees of freedom)
- Motion preserving all edge lengths is possible

---

## 6. Special Configurations and Stratification

### The Dimension Stratification

Define strata based on affine dimension of vertex positions:

```
C^(k) = { p ∈ C : dim(aff(p(V))) ≤ k }
```

This gives a filtration:
```
C^(0) ⊂ C^(1) ⊂ C^(2) ⊂ ... ⊂ C^(d) = C
```

### Algebraic Characterization

Each stratum C^(k) is defined by the vanishing of certain minors:

```
C^(k) = C ∩ V(M_{k+1})
```

where M_{k+1} are the (k+1) × (k+1) minors of the position matrix:

```
P = [p(v₁) - p(v₀) | p(v₂) - p(v₀) | ... | p(vₙ₋₁) - p(v₀)]
```

### Cayley-Menger Characterization

Equivalently, using Cayley-Menger determinants:

```
C^(k) = { p ∈ C : CM(pᵢ₀, ..., pᵢₖ₊₁) = 0 for all (k+2)-subsets }
```

### Boundary Structure

The boundary ∂C^(k) = C^(k) \ C^(k-1) consists of configurations with affine dimension exactly k.

**For path graphs**: The minimal dimension stratum C^(1) (collinear configurations) forms the boundary of the reduced configuration space.

---

## 7. Connections to Distance Geometry

### Distance Geometry Perspective

**Distance geometry** studies when a set of pairwise distances can be realized by points in ℝᵈ.

Given a graph G with edge weights (distances), the **distance realization problem** asks:
- Does a configuration p: V → ℝᵈ exist satisfying all distance constraints?
- If so, how many?

### Gram Matrix Approach

An alternative to the position space approach:

The **Gram matrix** G = PᵀP (where P is the centered position matrix) captures inner products.

**Theorem**: A distance matrix D is realizable in ℝᵈ iff the Gram matrix G = -½ J D² J (with centering matrix J) is positive semidefinite with rank ≤ d.

### Connection to Cayley-Menger

The Cayley-Menger determinant is related to the Gram matrix:

```
det(CM) = (-1)^(n+1) · 2ⁿ · (n!)² · (Volume)²
```

Volume = 0 implies the Gram matrix drops rank, giving lower-dimensional embedding.

### Realizability in Each Dimension

For a distance matrix D (or partial distance matrix from a graph):

- **Realizable in ℝᵈ**: There exists p: V → ℝᵈ satisfying all distance constraints
- **Minimally realizable in ℝᵈ**: Realizable in ℝᵈ but not in ℝ^(d-1)

The **minimal realization dimension** is the combinatorial d_min(G) from matroid theory.

---

## Summary: Three Perspectives

| Perspective | Key Object | Dimension Measure |
|-------------|------------|-------------------|
| **Algebraic Geometry** | Variety C = V(f_e) | dim(C) = dn - rank(Jacobian) |
| **Matroid Theory** | Rigidity matroid R_d(G) | d_min(G) = min{d : rank = m} |
| **Distance Geometry** | Cayley-Menger / Gram | rank(Gram) = affine dimension |

All three perspectives yield the same answer for the minimal embedding dimension, but offer different computational and conceptual tools.

---

## References

1. **Connelly, R.** (1993). "Generic Global Rigidity." *Discrete & Computational Geometry*, 33(4), 549-563.

2. **Asimow, L. & Roth, B.** (1978). "The rigidity of graphs." *Transactions of the American Mathematical Society*, 245, 279-289.

3. **Liberti, L. et al.** (2014). "Euclidean Distance Geometry and Applications." *SIAM Review*, 56(1), 3-69.

4. **Saxe, J.B.** (1979). "Embeddability of weighted graphs in k-space is strongly NP-hard." *Proc. 17th Allerton Conference*, 480-489.

---

*This document is part of the Dimension Folding project. See [MATH.md](../MATH.md) for the main mathematical reference and [ROADMAP.md](../ROADMAP.md) for development plans.*
