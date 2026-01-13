# Dimension Folding

> An interactive exploration of the relationship between graphs, matroids, and linkages—investigating how abstract graph structures manifest as mechanical linkages in 3D space and fold into minimal-dimensional subspaces.

<p align="center">
  <img src="https://img.shields.io/badge/SolidJS-2C4F7C?style=for-the-badge&logo=solid&logoColor=white" alt="SolidJS" />
  <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

---

## Table of Contents

- [Overview](#overview)
- [Mathematical Background](#mathematical-background)
  - [From Graphs to Linkages](#from-graphs-to-linkages)
  - [Rigidity Theory](#rigidity-theory)
  - [The Folding Problem](#the-folding-problem)
  - [Matroids and Independence](#matroids-and-independence)
- [Project Goals](#project-goals)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Key Concepts in the Codebase](#key-concepts-in-the-codebase)
- [Examples](#examples)
- [Roadmap](#roadmap)
- [References](#references)

---

## Overview

This project provides an interactive visualization platform for exploring the deep connections between:

1. **Graph Theory**: Abstract combinatorial structures of vertices and edges
2. **Linkages**: Mechanical systems of rigid bars connected by joints
3. **Matroid Theory**: Algebraic structures capturing notions of independence
4. **Rigidity Theory**: The study of when frameworks are rigid vs. flexible

The ultimate goal is to explore the **dimension folding problem**: given a graph realized as a linkage in ℝᵈ, what is the minimum dimension into which it can be continuously folded while preserving edge lengths?

## Mathematical Background

### From Graphs to Linkages

A **graph** G = (V, E) consists of a set of vertices V and edges E. A **linkage** (or **bar-and-joint framework**) is a realization of a graph in Euclidean space where:

- Each vertex v ∈ V is assigned a position p(v) ∈ ℝᵈ
- Each edge e = {u, v} ∈ E represents a rigid bar of length ||p(u) - p(v)||

The collection (G, p) where p: V → ℝᵈ is called a **framework**.

### Rigidity Theory

A framework is:

- **Rigid**: if every continuous motion preserving edge lengths is a rigid motion (rotation + translation)
- **Flexible**: if there exist non-trivial continuous motions preserving edge lengths
- **Infinitesimally rigid**: if the only infinitesimal motions preserving edge lengths are infinitesimal rigid motions

**Key insight**: The rigidity of a generic framework depends only on the graph structure, not the specific embedding. This leads to the concept of a graph being "generically rigid" in ℝᵈ.

#### The Rigidity Matrix

For a framework (G, p) in ℝᵈ, the **rigidity matrix** R is an |E| × d|V| matrix where each row corresponds to an edge and captures the constraint that edge lengths must be preserved under infinitesimal motion:

```
R_{e,(v,i)} = { p(u)_i - p(v)_i   if e = {u,v}
             { 0                  otherwise
```

The framework is infinitesimally rigid iff rank(R) = d|V| - (d+1)d/2 (accounting for trivial rigid motions).

### The Folding Problem

The **dimension folding problem** asks:

> Given a graph G that is generically rigid in ℝᵈ, what is the minimum dimension ℝᵏ (k ≤ d) into which any realization can be continuously deformed while preserving edge lengths?

**Examples**:

| Graph | Description | Minimal Dimension | Degrees of Freedom |
|-------|-------------|-------------------|-------------------|
| K₁,₂ (V-shape) | Path of 2 edges | 1 | 1 internal DOF (can fold flat) |
| K₃ (Triangle) | Complete graph on 3 vertices | 2 | 0 internal DOF (rigid in 2D) |
| K₄ (Tetrahedron) | Complete graph on 4 vertices | 3 | 0 internal DOF (rigid in 3D) |
| K₂,₃ | Complete bipartite graph | 2 | 1 internal DOF |

The project visualizes these frameworks and their allowable motions, with sphere intersections showing the geometric constraints.

### Matroids and Independence

**Matroids** abstract the notion of linear independence to combinatorial settings. The connection to rigidity:

1. **Graphic Matroid**: M(G) captures cycle structure; independent sets are forests
2. **Rigidity Matroid**: R_d(G) where independent sets are "generically independent" edge sets in ℝᵈ

For a graph G in ℝ²:
- Maxwell's condition: |E| ≤ 2|V| - 3 (necessary for independence)
- Laman's condition: For all subgraphs H, |E(H)| ≤ 2|V(H)| - 3 (sufficient in 2D)

The **rigidity matroid** R_d(G) is formed by taking the row matroid of the rigidity matrix for a generic embedding.

---

## Project Goals

### Phase 1: Visualization Foundation ✅
- [x] Render graphs as 2D diagrams with adjacency/incidence matrices
- [x] Embed graphs as linkages in 3D space using Three.js
- [x] Display coordinate matrices synchronized with 3D visualization
- [x] Interactive camera controls (orbit, zoom, pan)

### Phase 2: Constraint Visualization ✅
- [x] Visualize distance constraints as sphere intersections
- [x] Show circles of intersection (allowable positions for constrained vertices)
- [x] Render intersection points where three or more constraints meet

### Phase 3: Motion Animation 🚧
- [x] Timeline-based transformation playback
- [x] Interpolated motion between configurations
- [ ] Constraint-preserving motion (edge-length preservation)
- [ ] Detection of rigid vs. flexible configurations

### Phase 4: Rigidity Analysis 📋
- [ ] Rigidity matrix computation and display
- [ ] Rank analysis for rigidity determination
- [ ] Degrees of freedom calculation
- [ ] Identification of rigid components

### Phase 5: Folding Exploration 📋
- [ ] Dimension reduction pathfinding
- [ ] Continuous folding animation
- [ ] Minimal dimension computation
- [ ] Folding trajectory visualization

### Phase 6: Advanced Features 📋
- [ ] Custom graph input/editor
- [ ] Matroid visualization
- [ ] Stress analysis
- [ ] Export configurations

---

## Architecture

```
src/
├── app.tsx                          # Root application with routing
├── routes/
│   ├── index.tsx                    # Landing page
│   ├── about.tsx                    # About page
│   └── graphs/
│       └── exploration/
│           ├── index.tsx            # Main graph exploration page
│           ├── graphUtils.ts        # Graph construction (K3, V-graph, etc.)
│           ├── matrixUtils.ts       # Matrix computations (adjacency, incidence, coordinates)
│           ├── layout.ts            # 2D layout algorithms
│           ├── ThreeJSGraph.tsx     # 3D visualization component
│           ├── threeUtils.ts        # Three.js utilities (spheres, intersections, edges)
│           ├── MatrixTable.tsx      # Matrix display component
│           └── Timeline.tsx         # Animation timeline component
```

### Core Technologies

| Technology | Purpose |
|-----------|---------|
| **SolidJS** | Reactive UI framework with fine-grained reactivity |
| **SolidStart** | Full-stack meta-framework with file-based routing |
| **Three.js** | WebGL-based 3D graphics rendering |
| **Graphology** | Graph data structure library |
| **D3.js** | Visualization utilities |
| **Vinxi** | Build tooling and dev server |

---

## Getting Started

### Prerequisites

- Node.js ≥ 22
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Dimension-Folding

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The application will be available at `http://localhost:3000`.

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |

---

## Key Concepts in the Codebase

### Graph Representation

Graphs are represented using the [Graphology](https://graphology.github.io/) library, with nodes containing:

```typescript
interface NodeAttributes {
  label: string;                          // Display label
  size: number;                           // Visual size
  color: string;                          // Visual color
  coordinates: [number, number, number];  // 3D position (x, y, z)
  x: number;                              // 2D layout position
  y: number;
}
```

### Constraint Spheres

For each vertex v with neighbors u₁, u₂, ..., uₖ, the allowable positions form the intersection of k spheres centered at each neighbor with radius equal to the edge length:

```
S_i = { p ∈ ℝ³ : ||p - p(uᵢ)|| = ||p(v) - p(uᵢ)|| }
```

The intersection ∩Sᵢ gives the constraint manifold for v.

### Transformation System

Transformations are represented as Three.js `Matrix4` objects and applied to node positions through interpolated animation:

```typescript
const transformations = [
  new THREE.Matrix4().makeRotationY(Math.PI / 4),
  new THREE.Matrix4().makeScale(1.5, 1.5, 1.5),
  // ... more transformations
];
```

---

## Examples

### K₁,₂ (V-Graph / Path Graph)

```
  1
 / \
2   3
```

- **Vertices**: 3
- **Edges**: 2
- **Rigid in ℝ²?**: No (1 degree of freedom)
- **Minimal dimension**: 1 (can fold to a line)

### K₃ (Triangle)

```
  1
 / \
2---3
```

- **Vertices**: 3
- **Edges**: 3
- **Rigid in ℝ²?**: Yes (0 internal DOF)
- **Minimal dimension**: 2 (inherently planar)

### K₄ (Complete Graph on 4 vertices)

- **Vertices**: 4
- **Edges**: 6
- **Rigid in ℝ³?**: Yes
- **Minimal dimension**: 3 (tetrahedral structure)

---

## Roadmap

### Near-term
- [ ] Implement constraint-preserving motion (true linkage kinematics)
- [ ] Add rigidity matrix visualization
- [ ] Compute and display degrees of freedom
- [ ] Support for more graph families (complete graphs, bipartite graphs, platonic solids)

### Medium-term
- [ ] Interactive graph editor
- [ ] Folding path computation algorithms
- [ ] Matroid visualization and comparison
- [ ] Save/load configurations

### Long-term
- [ ] Higher-dimensional embeddings (ℝ⁴ and beyond with projections)
- [ ] Stress/force visualization
- [ ] Collaborative sharing
- [ ] Integration with computational geometry libraries

---

## References

### Foundational Papers

1. **Laman, G.** (1970). "On graphs and rigidity of plane skeletal structures." *Journal of Engineering Mathematics*, 4(4), 331-340.

2. **Connelly, R.** (1980). "The rigidity of certain cabled frameworks and the second-order rigidity of arbitrarily triangulated convex surfaces." *Advances in Mathematics*, 37(3), 272-299.

3. **Whiteley, W.** (1996). "Some matroids from discrete applied geometry." *Contemporary Mathematics*, 197, 171-311.

### Books

4. **Graver, J., Servatius, B., & Servatius, H.** (1993). *Combinatorial Rigidity*. Graduate Studies in Mathematics, AMS.

5. **Connelly, R. & Guest, S.** (2022). *Frameworks, Tensegrities, and Symmetry*. Cambridge University Press.

### Online Resources

6. [Rigidity Theory - Wikipedia](https://en.wikipedia.org/wiki/Rigidity_theory)
7. [Graphology Documentation](https://graphology.github.io/)
8. [Three.js Documentation](https://threejs.org/docs/)

---

## Contributing

This project welcomes contributions from mathematicians, computer scientists, and visualization enthusiasts. Areas where contributions are particularly valuable:

- Implementing rigidity analysis algorithms
- Adding new graph families and examples
- Improving visualization aesthetics
- Documentation and mathematical exposition
- Testing edge cases in constraint computations

---

## License

[MIT License](LICENSE)

---

<p align="center">
  <em>"The shortest path between two truths in the real domain passes through the complex domain."</em><br/>
  — Jacques Hadamard
</p>
