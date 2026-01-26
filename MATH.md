# Mathematical Foundations

> A rigorous treatment of the configuration space theory underlying dimension folding.

This document provides an overview of the mathematical framework for understanding linkage configuration spaces, the minimal embedding dimension problem, and the geometry of folding. It complements the introductory material in [README.md](./README.md).

---

## Quick Reference

| Topic | Document | Key Concepts |
|-------|----------|--------------|
| Configuration Spaces | [docs/CONFIGURATION-SPACES.md](./docs/CONFIGURATION-SPACES.md) | Ambient dimension, DOF, algebraic variety |
| Rigidity Matroids | [docs/RIGIDITY-MATROIDS.md](./docs/RIGIDITY-MATROIDS.md) | Independence, circuits, d_min |
| Cayley-Menger | [docs/CAYLEY-MENGER.md](./docs/CAYLEY-MENGER.md) | Volume from distances, dimension detection |
| Sphere Intersections | [docs/SPHERE-INTERSECTIONS.md](./docs/SPHERE-INTERSECTIONS.md) | Tangency, constraint geometry |
| Algebraic Geometry | [docs/ALGEBRAIC-GEOMETRY.md](./docs/ALGEBRAIC-GEOMETRY.md) | Varieties, smoothness, quotients |
| Worked Examples | [docs/EXAMPLES.md](./docs/EXAMPLES.md) | P₃, K₃, K₄, C₄ analysis |

---

## Core Concepts

### The Dimension Folding Problem

Given a linkage (graph with fixed edge lengths) in ℝᵈ, find the minimal dimension ℝᵏ (k ≤ d) into which it can be continuously deformed while preserving edge lengths.

**Examples:**
- P₃ (path on 3 vertices): Folds to dimension 1 (can collapse to a line)
- K₃ (triangle): Minimally dimension 2 (rigid triangle)
- K₄ (tetrahedron): Minimally dimension 3 (rigid tetrahedron)

### Configuration Space

The **configuration space** of a graph G = (V, E) with edge lengths L in dimension d is:

```
C_d(G, L) = { p: V → ℝᵈ | ‖p(u) - p(v)‖ = L(e) for all e = {u,v} ∈ E }
```

This is a real algebraic variety—the intersection of |E| quadric hypersurfaces.

**Dimension formula:**
```
dim(C_d/SE(d)) = d|V| - |E| - d(d+1)/2
```

This gives the **internal degrees of freedom** (DOF).

→ See [docs/CONFIGURATION-SPACES.md](./docs/CONFIGURATION-SPACES.md) for details.

### Rigidity Matroid

The minimal embedding dimension is often **combinatorially determined** by the graph structure:

```
d_min(G) = min{ d : all edge constraints are independent in ℝᵈ }
```

| Graph | d_min | Reason |
|-------|-------|--------|
| Kₙ | n-1 | Complete graph is rigid in (n-1)D |
| Pₙ | 1 | Path can always straighten |
| Cₙ (n≥4) | 2 | Cycle is flexible but planar |

→ See [docs/RIGIDITY-MATROIDS.md](./docs/RIGIDITY-MATROIDS.md) for details.

### Cayley-Menger Determinant

The dimension can be characterized algebraically. Points p₀, ..., pₖ lie in a (k-1)-dimensional subspace iff:

```
CM(p₀, ..., pₖ) = 0
```

where CM is the Cayley-Menger determinant—computed purely from pairwise distances.

→ See [docs/CAYLEY-MENGER.md](./docs/CAYLEY-MENGER.md) for details.

### Sphere Intersection Geometry

Each vertex lies at the intersection of spheres centered at its neighbors:

```
v ∈ ⋂_{u ∈ N(v)} S(p(u), L({v,u}))
```

**Key principle:** Sphere tangency ⟺ dimension reduction

→ See [docs/SPHERE-INTERSECTIONS.md](./docs/SPHERE-INTERSECTIONS.md) for details.

---

## The Two-Phase Approach

### Phase 1: Combinatorial Analysis

Compute d_min(G) from graph structure using the rigidity matroid:
- Identify rigid substructures (cliques)
- Count edges vs. DOF constraints
- This gives the "floor"—we can't go lower generically

### Phase 2: Geometric Realization

Given edge lengths, find a path to a d_min-dimensional configuration:
- Use Cayley-Menger to track volume/progress
- Volume → 0 indicates dimension reduction
- Tangency conditions signal arrival at lower dimension

---

## Minimal Dimension Problem

### Problem Statement

Given a linkage (G, L) with configuration p ∈ C, find:

```
dim_min(G, L, p) = min{ k : ∃ path γ in C with γ(0)=p and dim(γ(1))≤k }
```

### Key Results

**Theorem (Generic case):**
```
dim_min(G, L, p) = d_min(G)
```

For generic edge lengths, the achievable dimension equals the combinatorial minimum.

**Obstructions to folding:**
1. **Rigidity**: Linkage has no internal DOF
2. **Topological**: Lower-dimensional strata unreachable
3. **Geometric**: Edge lengths incompatible with lower dimension

---

## Visualization Implications

Based on this theory, effective visualizations should show:

1. **Tangency gap**: Distance to sphere tangency
2. **Intersection circle radius**: Approaches 0 at dimension drop
3. **Cayley-Menger volume**: Continuous measure of "dimension"
4. **Matroid structure**: Which subgraphs force the dimension floor

### Color Coding

| Element | Color | Meaning |
|---------|-------|---------|
| Transverse circle | Cyan | Generic configuration |
| Near-tangent | Yellow→Orange | Approaching lower dimension |
| Tangent point | Red | Dimension achieved |
| Constraint spheres | Blue wireframe | Edge constraints |

---

## Open Questions

### Theoretical

1. **Computational complexity**: What is the complexity of computing d_min(G)?
2. **Higher-dimensional Laman**: Combinatorial characterization for d ≥ 3?
3. **Non-generic edge lengths**: When is dimension < d_min(G) achievable?
4. **Clique-dimension gap**: When is d_min(G) > ω(G) - 1?

### Algorithmic

5. **Path finding**: Shortest path to lower-dimensional strata
6. **Gradient flow**: Can gradient descent on CM find folding paths?
7. **Obstacle avoidance**: Folding paths avoiding self-intersection

### Visualization

8. **Higher-dimensional intuition**: Visualizing configuration spaces
9. **Volume visualization**: Real-time CM display
10. **Singularity visualization**: Representing fiber degenerations

---

## References

### Foundational Texts

1. **Connelly, R. & Guest, S.** (2022). *Frameworks, Tensegrities, and Symmetry*. Cambridge University Press.

2. **Graver, J., Servatius, B., & Servatius, H.** (1993). *Combinatorial Rigidity*. Graduate Studies in Mathematics, AMS.

### Research Papers

3. **Laman, G.** (1970). "On graphs and rigidity of plane skeletal structures." *Journal of Engineering Mathematics*, 4(4), 331-340.

4. **Whiteley, W.** (1996). "Some matroids from discrete applied geometry." *Contemporary Mathematics*, 197, 171-311.

5. **Kapovich, M. & Millson, J.J.** (2002). "Universality theorems for configuration spaces of planar linkages." *Topology*, 41(6), 1051-1107.

6. **Farber, M.** (2008). "Invitation to Topological Robotics." *Zurich Lectures in Advanced Mathematics*, EMS.

### Distance Geometry

7. **Blumenthal, L.M.** (1970). *Theory and Applications of Distance Geometry*. Chelsea Publishing.

8. **Liberti, L., Lavor, C., Maculan, N., & Mucherino, A.** (2014). "Euclidean Distance Geometry and Applications." *SIAM Review*, 56(1), 3-69.

### Matroid Theory

9. **Oxley, J.** (2011). *Matroid Theory*. Oxford University Press. (2nd edition)

10. **Recski, A.** (1989). *Matroid Theory and its Applications in Electric Network Theory and in Statics*. Springer.

---

*This document is maintained as part of the Dimension Folding project. See [ROADMAP.md](./ROADMAP.md) for development plans and [TODOS.md](./TODOS.md) for implementation tasks.*
