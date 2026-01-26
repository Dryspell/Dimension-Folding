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
- [Quick Start](#quick-start)
- [Mathematical Background](#mathematical-background)
- [Current Status](#current-status)
- [Architecture](#architecture)
- [Examples](#examples)
- [Glossary](#glossary)
- [References](#references)
- [Contributing](#contributing)

---

## Overview

This project provides an interactive visualization platform for exploring the deep connections between:

| Domain | Description |
|--------|-------------|
| **Graph Theory** | Abstract combinatorial structures of vertices and edges |
| **Linkages** | Mechanical systems of rigid bars connected by joints |
| **Rigidity Theory** | The study of when frameworks are rigid vs. flexible |
| **Matroid Theory** | Algebraic structures capturing notions of independence |

### The Central Question

> Given a graph G realized as a linkage in ℝᵈ, what is the **minimum dimension** into which it can be continuously folded while preserving edge lengths?

This is the **dimension folding problem**—the driving research question behind this project.

---

## Quick Start

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

## Mathematical Background

### From Graphs to Linkages

A **graph** G = (V, E) consists of a set of vertices V and edges E. A **linkage** (or **bar-and-joint framework**) is a realization of a graph in Euclidean space where:

- Each vertex v ∈ V is assigned a position p(v) ∈ ℝᵈ
- Each edge e = {u, v} ∈ E represents a rigid bar of length ‖p(u) - p(v)‖

The collection (G, p) where p: V → ℝᵈ is called a **framework**.

### Rigidity

A framework is:

| Type | Definition |
|------|------------|
| **Rigid** | Every continuous motion preserving edge lengths is a rigid motion (rotation + translation) |
| **Flexible** | Non-trivial continuous motions exist that preserve edge lengths |
| **Infinitesimally rigid** | Only infinitesimal rigid motions preserve edge lengths |

**Key insight**: The rigidity of a generic framework depends only on the graph structure, not the specific embedding.

### The Rigidity Matrix

For a framework (G, p) in ℝᵈ, the **rigidity matrix** R is an |E| × d|V| matrix. Each row corresponds to an edge constraint:

```
R_{e,(v,i)} = p(u)ᵢ - p(v)ᵢ    if e = {u,v}
            = 0                 otherwise
```

The framework is **infinitesimally rigid** iff:

```
rank(R) = d|V| - d(d+1)/2
```

where d(d+1)/2 accounts for trivial rigid motions.

### Dimension Folding Examples

| Graph | Description | Min. Dimension | Internal DOF |
|-------|-------------|----------------|--------------|
| K₁,₂ (V-shape) | Path of 2 edges | 1 | 1 (can fold flat) |
| K₃ (Triangle) | Complete graph, 3 vertices | 2 | 0 (rigid in 2D) |
| K₄ (Tetrahedron) | Complete graph, 4 vertices | 3 | 0 (rigid in 3D) |
| K₂,₃ | Complete bipartite | 2 | 1 |

### Matroids and Independence

**Matroids** abstract linear independence to combinatorial settings:

- **Graphic Matroid** M(G): Independent sets are forests
- **Rigidity Matroid** R_d(G): Independent sets are "generically independent" edge sets in ℝᵈ

For a graph G in ℝ²:
- **Maxwell's condition**: |E| ≤ 2|V| - 3 (necessary)
- **Laman's condition**: ∀H ⊆ G, |E(H)| ≤ 2|V(H)| - 3 (sufficient in 2D)

---

## Current Status

| Phase | Status | Description |
|-------|--------|-------------|
| **1. Visualization Foundation** | ✅ Complete | 2D/3D graph rendering, matrix displays, camera controls |
| **2. Constraint Visualization** | ✅ Complete | Sphere intersections, constraint circles, intersection points |
| **3. Motion Animation** | 🚧 In Progress | Timeline playback works; constraint-preserving motion pending |
| **4. Rigidity Analysis** | 📋 Planned | Rigidity matrix, rank analysis, DOF calculation |
| **5. Dimension Folding** | 📋 Planned | Folding paths, minimal dimension computation |
| **6. Graph Editor** | 📋 Planned | Interactive graph creation and editing |

### What's Working Now

- Render graphs as 2D diagrams with adjacency/incidence matrices
- Embed graphs as linkages in 3D space with Three.js
- Visualize distance constraints as sphere intersections
- Timeline-based transformation playback with scrubbing
- Interactive camera controls (orbit, zoom, pan)

### Next Priority

Implementing **constraint-preserving motion**—animations that maintain edge lengths, enabling true linkage kinematics.

---

**For detailed planning, see:**
- [ROADMAP.md](./ROADMAP.md) — Strategic development phases and milestones
- [TODOS.md](./TODOS.md) — Granular task list with priorities

---

## Architecture

```
src/
├── app.tsx                          # Root application with routing
├── components/
│   ├── main-nav.tsx                 # Navigation component
│   └── ui/                          # Reusable UI components (shadcn/ui style)
├── routes/
│   ├── index.tsx                    # Landing page
│   ├── about.tsx                    # About page
│   └── graphs/
│       └── exploration/
│           ├── index.tsx            # Main exploration page
│           ├── graphUtils.ts        # Graph construction (K₃, V-graph)
│           ├── matrixUtils.ts       # Matrix computations
│           ├── layout.ts            # 2D layout algorithms
│           ├── ThreeJSGraph.tsx     # 3D visualization component
│           ├── threeUtils.ts        # Three.js utilities
│           ├── MatrixTable.tsx      # Matrix display component
│           └── Timeline.tsx         # Animation timeline
```

### Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **SolidJS** | ^1.9 | Reactive UI with fine-grained reactivity |
| **SolidStart** | ^1.1 | Meta-framework with file-based routing |
| **Three.js** | ^0.182 | WebGL 3D graphics rendering |
| **Graphology** | ^0.26 | Graph data structures |
| **TypeScript** | Latest | Type safety |
| **Tailwind CSS** | ^3 | Utility-first styling |

---

## Examples

### K₁,₂ (V-Graph / Path Graph)

```
    1
   / \
  2   3
```

A flexible framework with 1 internal degree of freedom. Can be continuously folded from 2D to 1D (collinear).

### K₃ (Triangle)

```
    1
   / \
  2---3
```

A rigid framework in ℝ². Cannot be deformed without changing edge lengths. Minimal embedding dimension is 2.

### K₄ (Tetrahedron)

The complete graph on 4 vertices forms a rigid tetrahedron in ℝ³. With 6 edges and 4 vertices, it satisfies:

```
|E| = 6 = 3|V| - 6 = 3(4) - 6
```

This is exactly the count for a minimally rigid framework in 3D.

---

## Glossary

| Term | Definition |
|------|------------|
| **Framework** | Graph G with position map p: V → ℝᵈ |
| **Linkage** | Framework with fixed edge lengths |
| **Configuration space** | Set of all valid positions for a linkage |
| **Rigidity matrix** | Jacobian of edge length constraints |
| **Generic position** | Position avoiding special algebraic relations |
| **Trivial motion** | Rigid motion (rotation + translation) |
| **Internal DOF** | dim(config space) - dim(trivial motions) |
| **Laman graph** | Minimally rigid graph in 2D |
| **Matroid** | Set system abstracting linear independence |

---

## References

### Books

1. **Graver, J., Servatius, B., & Servatius, H.** (1993). *Combinatorial Rigidity*. Graduate Studies in Mathematics, AMS.

2. **Connelly, R. & Guest, S.** (2022). *Frameworks, Tensegrities, and Symmetry*. Cambridge University Press.

### Papers

3. **Laman, G.** (1970). "On graphs and rigidity of plane skeletal structures." *Journal of Engineering Mathematics*, 4(4), 331-340.

4. **Connelly, R.** (1980). "The rigidity of certain cabled frameworks and the second-order rigidity of arbitrarily triangulated convex surfaces." *Advances in Mathematics*, 37(3), 272-299.

5. **Whiteley, W.** (1996). "Some matroids from discrete applied geometry." *Contemporary Mathematics*, 197, 171-311.

### Online Resources

- [Rigidity Theory - Wikipedia](https://en.wikipedia.org/wiki/Rigidity_theory)
- [Graphology Documentation](https://graphology.github.io/)
- [Three.js Documentation](https://threejs.org/docs/)
- [SolidJS Documentation](https://www.solidjs.com/)

---

## Contributing

Contributions are welcome from mathematicians, computer scientists, and visualization enthusiasts.

### Areas of Interest

- **Algorithms**: Rigidity analysis, constraint solvers, folding path computation
- **Graph Theory**: New graph families, Laman graph examples, matroid operations
- **Visualization**: UI/UX improvements, animation polish, accessibility
- **Documentation**: Mathematical exposition, tutorials, examples
- **Testing**: Unit tests for mathematical functions, edge case verification

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Read [TODOS.md](./TODOS.md) for task ideas
4. Make your changes
5. Submit a pull request

---

## License

[MIT License](LICENSE)

---

<p align="center">
  <em>"The shortest path between two truths in the real domain passes through the complex domain."</em><br/>
  — Jacques Hadamard
</p>
