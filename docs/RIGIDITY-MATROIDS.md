# Rigidity Matroids and Combinatorial Dimension

> The minimal embedding dimension of a graph is often combinatorially determined—it depends on the graph structure, not the specific edge lengths.

This document develops the rigidity matroid perspective on dimension folding, connecting graph theory to geometric rigidity.

---

## Table of Contents

- [1. The Key Insight](#1-the-key-insight)
- [2. The Rigidity Matroid](#2-the-rigidity-matroid)
- [3. Independence and Circuits](#3-independence-and-circuits)
- [4. The Rigidity Matrix](#4-the-rigidity-matrix)
- [5. Combinatorial Minimal Dimension](#5-combinatorial-minimal-dimension)
- [6. Worked Examples: P₃ vs K₃](#6-worked-examples-p₃-vs-k₃)
- [7. Laman's Theorem](#7-lamans-theorem)
- [8. Matroid Operations](#8-matroid-operations)
- [9. Computing d_min](#9-computing-d_min)

---

## 1. The Key Insight

The minimal embedding dimension of a graph is often **combinatorially determined**—it depends on the graph structure, not the specific edge lengths. This is captured by the **rigidity matroid**.

In classical matroid theory, dependencies are often defined in terms of **linear independence** of vectors. Here, however, the dependencies are **distance-based**, defined by edges in a graph. This suggests a structure related to **rigidity matroids**.

Key differences from classical matroids:
- **Independence** means edges impose non-redundant constraints on node positions
- **Dependence** means some edge distances can be derived from others
- The underlying constraints are **nonlinear** (quadratic), but genericity allows linear analysis

---

## 2. The Rigidity Matroid

For a graph G = (V, E) and dimension d, the **rigidity matroid** R_d(G) is defined on the edge set E:

- **Ground set**: E (edges)
- **Independent sets**: Subsets of edges that impose independent constraints on generic frameworks
- **Rank function**: ρ_d(F) = rank of constraints imposed by edge set F

The rank of R_d(G) determines the dimension of the configuration space.

### Independence in the Rigidity Matroid

A set of edges F ⊆ E is **independent in R_d** if:
- The constraints they impose are algebraically independent
- Equivalently: the corresponding rows of the rigidity matrix are linearly independent (for generic positions)

**Maximum possible rank:**
```
ρ_d^max = d|V| - d(d+1)/2
```

This is the dimension of position space minus trivial motions.

---

## 3. Independence and Circuits

### Independent Sets

A set of edges (constraints) is **independent** if it forms a configuration in the target dimension without over-constraining the nodes. Removing any edge would make the configuration **flexible**—allowing nodes to move in a way that changes dimensionality without violating remaining constraints.

### Dependent Sets and Circuits

A **dependent set** of edges forms a configuration where removing any edge still results in rigidity, implying some edges are **redundant**.

**Circuits** are minimal dependent sets:
- In a triangle graph in 2D, all three edges form a circuit
- Removing any one edge leaves a rigid 2D configuration
- Removing two edges makes it flexible

### Flexibility and Dimensional Reduction

A configuration is **flexible** if it has degrees of freedom within the constraints. This flexibility implies the existence of motions that can reduce the dimensional span of the vertices.

**Key principle**: Lack of circuits implies flexibility, which implies the existence of dimension-reducing motions.

---

## 4. The Rigidity Matrix

The **rigidity matrix** R(p) is the Jacobian of edge constraint functions evaluated at configuration p. It captures how vertex positions must satisfy distance constraints.

### Construction

For a graph with n vertices in ℝᵈ:
- **Rows**: One per edge (m rows total)
- **Columns**: d columns per vertex (nd columns total)
- **Entry format**: For edge e = (i,j), the row contains coordinate differences

For edge (1-2) connecting vertices with positions (x₁,y₁,z₁) and (x₂,y₂,z₂):

```
Row for edge (1-2):
[ (x₁-x₂)  (y₁-y₂)  (z₁-z₂) | -(x₁-x₂)  -(y₁-y₂)  -(z₁-z₂) | 0  0  0 | ... ]
     vertex 1 columns              vertex 2 columns           vertex 3...
```

### Example: P₃ (Path on 3 vertices)

For nodes 1, 2, 3 with edges (1-2) and (2-3) in 3D:

```
R = [ (x₁-x₂)  (y₁-y₂)  (z₁-z₂)  -(x₁-x₂)  -(y₁-y₂)  -(z₁-z₂)   0        0        0     ]
    [    0        0        0      (x₂-x₃)   (y₂-y₃)   (z₂-z₃)  -(x₂-x₃) -(y₂-y₃) -(z₂-z₃) ]
```

This 2×9 matrix has rank at most 2, indicating flexibility.

### Example: K₃ (Triangle)

Adding edge (1-3):

```
R = [ (x₁-x₂)  (y₁-y₂)  (z₁-z₂)  -(x₁-x₂)  -(y₁-y₂)  -(z₁-z₂)   0        0        0     ]
    [    0        0        0      (x₂-x₃)   (y₂-y₃)   (z₂-z₃)  -(x₂-x₃) -(y₂-y₃) -(z₂-z₃) ]
    [ (x₁-x₃)  (y₁-y₃)  (z₁-z₃)     0        0        0       -(x₁-x₃) -(y₁-y₃) -(z₁-z₃) ]
```

In 2D, this 3×6 matrix achieves full rank (3), making the triangle rigid.

### Rank and Flexibility

```
dim(C_d/SE(d)) = d|V| - rank(R) - d(d+1)/2
```

- **Full rank**: Configuration is rigid (dim = 0)
- **Rank deficient**: Configuration is flexible (dim > 0)

---

## 5. Combinatorial Minimal Dimension

### Definition

The **combinatorial minimal dimension** of G is:

```
d_min(G) = min{ d : ρ_d(G) = |E| }
```

This is the smallest dimension where all edge constraints can be simultaneously satisfied (generically).

**Key property**: d_min(G) depends only on the graph structure, not on edge lengths.

### Examples of d_min

| Graph | d_min | Reasoning |
|-------|-------|-----------|
| K₁ | 0 | Single point |
| K₂ | 1 | Two points at fixed distance → line |
| K₃ | 2 | Triangle is rigid in 2D |
| K₄ | 3 | Tetrahedron is rigid in 3D |
| Kₙ | n-1 | Complete graph on n vertices |
| P_n (path) | 1 | Path can always be straightened |
| C_n (cycle, n≥4) | 2 | Cycle is flexible but planar |
| K_{2,3} | 2 | Complete bipartite |

### The Suspension (Cone) Operation

**Definition**: The **suspension** (or cone) of G, denoted Σ(G), is formed by:
1. Adding a new vertex v*
2. Connecting v* to all vertices of G

**Theorem**: If d_min(G) = k, then d_min(Σ(G)) = k + 1.

**Examples:**
```
Σ(K₁) = K₂        d_min: 0 → 1
Σ(K₂) = K₃        d_min: 1 → 2
Σ(K₃) = K₄        d_min: 2 → 3
Σ(Kₙ) = K_{n+1}   d_min: (n-1) → n
```

This explains why complete graphs have d_min(Kₙ) = n-1: they are iterated suspensions of a point.

### Subgraph Lower Bounds

**Theorem**: For any subgraph H ⊆ G:
```
d_min(G) ≥ d_min(H)
```

**Corollary**: To find d_min(G), identify the "most rigid" substructure.

---

## 6. Worked Examples: P₃ vs K₃

This comparison illustrates how graph structure determines flexibility.

### P₃ (Path: 1 — 2 — 3)

**Structure:**
- 3 vertices, 2 edges
- Edges: (1-2), (2-3)

**Rigidity matrix (3D):**
- 2 rows, 9 columns
- Rank: 2 (less than max possible)

**Analysis:**
- Internal DOF: 3(3) - 2 - 6 = 1
- The configuration is **flexible**
- The rank deficiency indicates a **motion exists**
- This motion can reduce dimension from 2D to 1D (collinear)

**Matroid interpretation:**
- Two edges are **independent** (neither is redundant)
- No circuits exist in this edge set
- Flexibility implies dimensional reduction is possible
- **d_min(P₃) = 1** (can always fold to a line)

### K₃ (Triangle: 1 — 2 — 3 — 1)

**Structure:**
- 3 vertices, 3 edges
- Edges: (1-2), (2-3), (1-3)

**Rigidity matrix (2D):**
- 3 rows, 6 columns
- Rank: 3 (full rank for 2D rigidity)

**Analysis in 2D:**
- Internal DOF: 2(3) - 3 - 3 = 0
- The configuration is **rigid**
- No motions preserve all edge lengths
- **Cannot reduce dimension below 2**

**Matroid interpretation:**
- The three edges form a **circuit** in 2D
- Any two edges are independent (basis)
- The third edge is redundant for rigidity but necessary for the structure
- **d_min(K₃) = 2**

### Comparison Summary

| Property | P₃ | K₃ |
|----------|-----|-----|
| Vertices | 3 | 3 |
| Edges | 2 | 3 |
| DOF (2D) | 1 | 0 |
| Flexible? | Yes | No (in 2D) |
| Contains circuit? | No | Yes (in 2D) |
| d_min | 1 | 2 |
| Can fold to line? | Yes | No |

---

## 7. Laman's Theorem

**Theorem (Laman, 1970)**: A graph G is minimally rigid in ℝ² if and only if:
1. |E| = 2|V| - 3
2. For every non-empty subgraph H: |E(H)| ≤ 2|V(H)| - 3

A graph satisfying condition (2) is called a **Laman graph**.

**Consequence**: For planar rigidity, we have a purely combinatorial characterization.

### Examples

| Graph | |V| | |E| | 2|V|-3 | Laman? |
|-------|-----|-----|--------|--------|
| K₃ | 3 | 3 | 3 | Yes (minimally rigid in 2D) |
| K₄ | 4 | 6 | 5 | No (over-constrained in 2D) |
| C₄ | 4 | 4 | 5 | No (under-constrained in 2D) |

### Higher-Dimensional Rigidity

For d ≥ 3, no complete combinatorial characterization is known, but:

**Necessary conditions** for independence in R_d(G):
- |E| ≤ d|V| - d(d+1)/2
- For all subgraphs H: |E(H)| ≤ d|V(H)| - d(d+1)/2

**Sufficient conditions** are more complex and involve algebraic geometry.

---

## 8. Matroid Operations

### Edge Deletion (G - e)

- Removes a constraint
- May decrease d_min or keep it the same
- d_min(G - e) ≤ d_min(G)

### Edge Contraction (G / e)

- Merges two vertices
- Effect on d_min is more complex
- Generally: d_min(G / e) ≤ d_min(G)

### Vertex Deletion (G - v)

- Removes vertex and all incident edges
- d_min(G - v) ≤ d_min(G)

---

## 9. Computing d_min

### Algorithm

```
for d = 1, 2, 3, ...:
    if rank(R_d(G)) == |E|:
        return d
```

### Practical Approach

1. Find clique number ω(G) = max{ k : Kₖ ⊆ G }
2. d_min(G) ≥ ω(G) - 1
3. Check if G can be realized in ℝ^(ω(G)-1) using constraint counting

### Subgraph Analysis Examples

**K₃ with pendant edge** (triangle + one extra edge):
- Contains K₃, so d_min ≥ 2
- The pendant edge adds flexibility but can't reduce below 2
- d_min = 2

**Two K₃ sharing an edge** (diamond/bowtie):
- Contains K₃, so d_min ≥ 2
- The shared edge acts as a hinge
- Can rotate in a plane → d_min = 2

**K₄ minus one edge**:
- Contains K₃ (multiple copies), so d_min ≥ 2
- Missing edge provides flexibility
- d_min = 2 (can flatten the "open tetrahedron")

---

## The Two-Phase Approach to Dimension Folding

### Phase 1: Combinatorial Analysis

- Compute d_min(G) from graph structure
- Identify rigid substructures that force dimension
- This is the "floor" — we can't go lower (generically)

### Phase 2: Geometric Realization

- Given edge lengths, find path to d_min-dimensional configuration
- Use Cayley-Menger to track volume/progress
- Tangency conditions signal arrival at lower dimension

### Key Theorem

For generic edge lengths:
```
dim_min(G, L, p) = d_min(G)
```

For special edge lengths, it may be possible to achieve dimension < d_min(G), but this is non-generic.

---

## Connection to Other Topics

- **Cayley-Menger Determinants**: Measure volume to track dimensional reduction. See [CAYLEY-MENGER.md](./CAYLEY-MENGER.md).
- **Sphere Intersections**: Geometric constraints from edges. See [SPHERE-INTERSECTIONS.md](./SPHERE-INTERSECTIONS.md).
- **Algebraic Geometry**: Configuration spaces as varieties. See [ALGEBRAIC-GEOMETRY.md](./ALGEBRAIC-GEOMETRY.md).

---

## References

1. **Laman, G.** (1970). "On graphs and rigidity of plane skeletal structures." *Journal of Engineering Mathematics*, 4(4), 331-340.

2. **Whiteley, W.** (1996). "Some matroids from discrete applied geometry." *Contemporary Mathematics*, 197, 171-311.

3. **Graver, J., Servatius, B., & Servatius, H.** (1993). *Combinatorial Rigidity*. Graduate Studies in Mathematics, AMS.

4. **Oxley, J.** (2011). *Matroid Theory*. Oxford University Press. (2nd edition)

---

*This document is part of the Dimension Folding project. See [../MATH.md](../MATH.md) for an overview.*
