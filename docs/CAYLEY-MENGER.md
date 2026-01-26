# Cayley-Menger Determinants

> Cayley-Menger determinants provide an algebraic characterization of dimension, measuring volumes purely from pairwise distances.

This document covers the Cayley-Menger formalism for detecting dimensional degeneracy and measuring distance to lower-dimensional configurations.

---

## Table of Contents

- [1. Motivation](#1-motivation)
- [2. The Cayley-Menger Determinant](#2-the-cayley-menger-determinant)
- [3. Volume Formula](#3-volume-formula)
- [4. Dimension Characterization](#4-dimension-characterization)
- [5. Examples](#5-examples)
- [6. Volume Minimization Perspective](#6-volume-minimization-perspective)

---

## 1. Motivation

The dimension stratification can be characterized algebraically using **Cayley-Menger determinants**. These determinants measure the k-dimensional volume of a simplex and vanish exactly when the vertices lie in a lower-dimensional subspace.

**Key advantages:**
- Computed purely from **pairwise distances** (no coordinates needed)
- Provides a **continuous measure** of "how close" to lower dimension
- Enables algebraic characterization of dimension strata

---

## 2. The Cayley-Menger Determinant

### Definition

For points p₀, p₁, ..., pₖ in ℝᵈ, let dᵢⱼ = ‖pᵢ - pⱼ‖. The **Cayley-Menger determinant** is:

```
CM(p₀,...,pₖ) = |  0    1    1    1   ...   1   |
                |  1    0   d₀₁²  d₀₂² ... d₀ₖ² |
                |  1   d₁₀²  0   d₁₂² ... d₁ₖ² |
                |  1   d₂₀² d₂₁²  0   ... d₂ₖ² |
                | ...  ...  ...  ...  ...  ... |
                |  1   dₖ₀² dₖ₁² dₖ₂² ...  0   |
```

This is a **(k+2) × (k+2)** determinant.

### Structure

- First row/column: Border of 0s and 1s
- Inner (k+1) × (k+1) block: Squared distances between points
- Diagonal of inner block: All zeros (distance from point to itself)
- Symmetric: dᵢⱼ = dⱼᵢ

---

## 3. Volume Formula

The k-dimensional volume of the k-simplex with vertices p₀, ..., pₖ is:

```
Vol_k² = (-1)^(k+1) / (2^k (k!)²) × CM(p₀,...,pₖ)
```

### Special Cases

**For k=1 (edge length):**
```
CM(p₀,p₁) = |  0    1    1   |
            |  1    0   d₀₁² |  = -d₀₁²
            |  1   d₀₁²  0   |

Vol₁ = d₀₁  (length of edge)
```

**For k=2 (triangle area):**
```
16 × Area² = CM(p₀,p₁,p₂)
```

This is Heron's formula in determinant form.

**For k=3 (tetrahedron volume):**
```
288 × Vol₃² = -CM(p₀,p₁,p₂,p₃)
```

---

## 4. Dimension Characterization

### Main Theorem

**Theorem**: The points p₀, ..., pₖ lie in a **(k-1)-dimensional affine subspace** if and only if:

```
CM(p₀, ..., pₖ) = 0
```

### Stratum Characterization

The dimension strata of a configuration space can be characterized:

```
C^(k) = { p ∈ C : CM(pᵢ₀,...,pᵢₖ₊₁) = 0 for all (k+2)-subsets {i₀,...,iₖ₊₁} ⊆ V }
```

In other words: p ∈ C^(k) iff every (k+2) vertices have zero (k+1)-volume.

### Volume as Continuous Measure

While dim(p) is an integer, the volume provides a **continuous measure** of "how close" a configuration is to a lower-dimensional embedding:

```
"Distance to C^(k)" ∝ max over (k+2)-subsets |CM(subset)|^(1/2)
```

This allows us to:
1. **Track progress** during folding (volume decreases)
2. **Detect stalling** (volume stuck above zero)
3. **Visualize proximity** to lower-dimensional configurations

---

## 5. Examples

### Collinearity of 3 Points

For 3 points p₁, p₂, p₃, they are collinear iff:

```
CM(p₁,p₂,p₃) = |  0    1    1    1   |
               |  1    0   d₁₂²  d₁₃² |
               |  1   d₂₁²  0   d₂₃² | = 0
               |  1   d₃₁² d₃₂²  0   |
```

**Expanding:** CM = 0 iff d₁₃ = d₁₂ + d₂₃ or d₁₃ = |d₁₂ - d₂₃|

This is the **triangle inequality becoming an equality**:
- d₁₃ = d₁₂ + d₂₃: point 2 is between points 1 and 3
- d₁₃ = |d₁₂ - d₂₃|: point 2 is outside the segment [1,3]

### Coplanarity of 4 Points

For 4 points p₁, p₂, p₃, p₄, they are coplanar iff:

```
CM(p₁,p₂,p₃,p₄) = |  0    1    1    1    1   |
                  |  1    0   d₁₂²  d₁₃²  d₁₄² |
                  |  1   d₂₁²  0   d₂₃²  d₂₄² | = 0
                  |  1   d₃₁² d₃₂²  0   d₃₄² |
                  |  1   d₄₁² d₄₂² d₄₃²  0   |
```

This 5×5 determinant can be computed **purely from pairwise distances**—no coordinates needed!

### P₃ Collinearity Condition

For the path graph P₃ with edge lengths L₁ = ‖v₁ - v₂‖ and L₂ = ‖v₂ - v₃‖:

The collinearity condition CM(v₁,v₂,v₃) = 0 expands to:

```
16 × Area² = 2L₁²L₂² + 2L₂²d₁₃² + 2d₁₃²L₁² - L₁⁴ - L₂⁴ - d₁₃⁴ = 0
```

With fixed L₁, L₂, this gives:
- d₁₃ = L₁ + L₂ (extended configuration)
- d₁₃ = |L₁ - L₂| (folded configuration)

These are exactly the **boundary points** of the reduced configuration space.

---

## 6. Volume Minimization Perspective

### Reformulating Dimension Folding

The **dimension folding problem** can be reframed as:

> Minimize the maximum (k+1)-volume over all (k+2)-subsets, subject to edge length constraints.

When this minimum is zero, the linkage can be embedded in dimension k.

### Optimization Problem

```
dim_min = min k such that:
  min_{γ:[0,1]→C, γ(0)=p} max_{S⊆V, |S|=k+2} |CM(γ(1)|_S)|^(1/2) = 0
```

In words: find a path in configuration space that drives all (k+2)-point volumes to zero.

### Algorithmic Implications

1. **Gradient descent on volume**: Minimize CM determinants while satisfying edge constraints
2. **Progress tracking**: Volume decreasing indicates approach to lower dimension
3. **Convergence detection**: Volume reaching zero signals dimension achieved

### Connection to Tangency

The Cayley-Menger determinant measures the "volume" that vanishes at tangency:

```
CM → 0  ⟺  dimension drops  ⟺  spheres become tangent
```

This unifies the algebraic (CM) and geometric (tangency) perspectives.

---

## Visualization Implications

### Volume-Based Progress Indicator

For tracking folding progress toward dimension k:

```
progress = 1 - (current_vol / initial_vol)
```

Display as a progress bar from 0% (initial) to 100% (dimension k reached).

### What to Display

- Volume of largest simplex (e.g., tetrahedron volume for 4+ vertices)
- Track volume decreasing during folding motion
- Highlight when volume approaches zero (dimension drop imminent)

---

## Connection to Other Topics

- **Sphere Intersections**: Tangency corresponds to CM = 0. See [SPHERE-INTERSECTIONS.md](./SPHERE-INTERSECTIONS.md).
- **Configuration Spaces**: Dimension strata via CM. See [CONFIGURATION-SPACES.md](./CONFIGURATION-SPACES.md).
- **Rigidity Matroids**: Combinatorial vs metric dimension. See [RIGIDITY-MATROIDS.md](./RIGIDITY-MATROIDS.md).

---

## References

1. **Blumenthal, L.M.** (1970). *Theory and Applications of Distance Geometry*. Chelsea Publishing.

2. **Liberti, L., Lavor, C., Maculan, N., & Mucherino, A.** (2014). "Euclidean Distance Geometry and Applications." *SIAM Review*, 56(1), 3-69.

3. **Sippl, M.J. & Scheraga, H.A.** (1986). "Cayley-Menger Coordinates." *Proceedings of the National Academy of Sciences*, 83(8), 2283-2287.

---

*This document is part of the Dimension Folding project. See [../MATH.md](../MATH.md) for an overview.*
