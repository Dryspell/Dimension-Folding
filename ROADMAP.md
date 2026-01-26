# Dimension Folding - Roadmap

> Strategic development plan for exploring the mathematical relationship between graphs, matroids, and linkages.

---

## Vision

Build an interactive platform that allows researchers and students to:
1. **Visualize** graphs as mechanical linkages in 3D space
2. **Analyze** rigidity properties through matrix computations
3. **Explore** dimension folding—finding minimal dimensional subspaces for linkage configurations
4. **Discover** connections between graph theory, rigidity theory, and matroid theory

---

## Core Research Goal: Path-Connectedness in Configuration Space

The ultimate aim of this project is to answer the **dimension folding problem**:

> Given a linkage in ℝᵈ, find the minimal dimension ℝᵏ (k ≤ d) into which it can be continuously deformed while preserving edge lengths.

### Mathematical Formulation

1. **Configuration Space**: C = {p : V → ℝ³ | ||p(u) - p(v)|| = L(e) for all edges e}
   - C is a real algebraic variety (intersection of sphere level sets)
   - For simple graphs, C ≈ product of spheres with constraints

2. **Dimension Strata**: C_k ⊂ C = configurations whose vertices span a k-dimensional affine subspace
   - C_1 ⊂ C_2 ⊂ C_3 = C (nested subsets)
   - "Folded" configurations lie in C_1 or C_2

3. **The Question**: For a configuration p ∈ C_3, is there a continuous path in C from p to C_1 or C_2?
   - This is a **path-connectedness** question
   - If yes, the path IS the folding animation
   - If no, the linkage cannot fold to lower dimension

4. **Special Points**: The minimal-dimension configurations are "special points" in C
   - These are the targets for our folding paths
   - They may lie on singular loci of the configuration variety

### What We're Building

1. **Visualize C** through the constraint spheres and intersection circles
2. **Navigate C** through the folding animations (paths in C)
3. **Find special points** by computing folding paths to minimal dimension
4. **Analyze path-connectedness** to determine if folding is possible

---

## Development Phases

### Phase 1: Visualization Foundation ✅ COMPLETE

**Goal**: Establish core infrastructure for graph and linkage visualization.

| Milestone | Status |
|-----------|--------|
| 2D graph rendering with Canvas API | ✅ |
| Adjacency and incidence matrix display | ✅ |
| 3D linkage embedding with Three.js | ✅ |
| Coordinate matrix synchronized with 3D scene | ✅ |
| Interactive camera controls (orbit, zoom, pan) | ✅ |
| Node hover information overlay | ✅ |

**Deliverable**: Working visualization of K₃ and K₁,₂ (V-graph) with matrix displays.

---

### Phase 2: Constraint Visualization ✅ COMPLETE

**Goal**: Visualize the geometric constraints that define linkage behavior.

| Milestone | Status |
|-----------|--------|
| Distance constraints as wireframe spheres | ✅ |
| Pairwise sphere intersection circles | ✅ |
| Triple constraint intersection points | ✅ |
| Visibility toggles for constraint elements | ✅ |

**Deliverable**: Clear visualization of the constraint manifold for any framework.

---

### Phase 3: Motion Animation ✅ COMPLETE

**Goal**: Animate linkages through their configuration space.

| Milestone | Status |
|-----------|--------|
| Timeline-based transformation playback | ✅ |
| Smooth interpolation between configurations | ✅ |
| Playback controls (play/pause, speed, direction) | ✅ |
| Scrubbing through transformation sequence | ✅ |
| Constraint-preserving motion (edge-length preservation) | ✅ |
| Detection of rigid vs. flexible configurations | ✅ |
| Motion path visualization (arcs on spheres) | ✅ |

**Deliverable**: Animate linkages along valid configuration paths while preserving bar lengths.

**Implementation**: 
- Transformations are now discrete, meaningful operations with start/end positions
- Folding uses FABRIK-style constraint projection to preserve edge lengths
- Arc interpolation along constraint spheres for visually accurate motion
- Orange arcs drawn on spheres showing the exact path through configuration space

---

### Phase 4: Rigidity Analysis ✅ COMPLETE

**Goal**: Compute and display rigidity properties of frameworks.

| Milestone | Status |
|-----------|--------|
| Rigidity matrix computation | ✅ |
| Rigidity matrix display in UI | ✅ |
| Matrix rank computation | ✅ |
| Infinitesimal rigidity determination | ✅ |
| Degrees of freedom (DOF) calculation | ✅ |
| Null space visualization (infinitesimal motions) | 🔲 |
| Rigid component identification | 🔲 |
| Maxwell counting rule display | 🔲 |

**Deliverable**: Full rigidity analysis panel showing matrix, rank, DOF, and rigidity classification.

**Mathematical Foundation**:
- Rigidity matrix R: |E| × d|V| matrix of edge constraints
- Infinitesimally rigid iff rank(R) = d|V| - d(d+1)/2
- DOF = d|V| - d(d+1)/2 - rank(R)

---

### Phase 5: Dimension Folding 🚧 IN PROGRESS

**Goal**: Explore the central research question—finding minimal embedding dimensions.

| Milestone | Status |
|-----------|--------|
| Dimension reduction feasibility check | ✅ |
| Folding path computation algorithm | ✅ |
| Continuous folding animation | ✅ |
| Minimal dimension display | ✅ |
| Arc path visualization on constraint spheres | ✅ |
| Transformation-based folding (discrete, inspectable steps) | ✅ |
| Folding trajectory visualization in config space | 🔲 |
| Dimension comparison view (side-by-side) | 🔲 |
| Stress-based folding heuristics | 🔲 |

**Deliverable**: Animate a linkage folding from ℝ³ to its minimal dimensional embedding.

**Research Questions to Address**:
1. What is the complexity of computing minimal folding dimension?
2. When is a framework "foldable" to a lower dimension?
3. Can we characterize graphs by their folding trajectories?

**Current Implementation**:
- Transformations are discrete, named operations (e.g., "Fold to Line")
- Each transformation is typed: "Rigid" (translate/rotate) or "Internal DOF" (uses flexibility)
- Arc paths are drawn on constraint spheres showing the configuration space trajectory
- Animation interpolates along sphere arcs (not linear), preserving constraints

---

### Phase 6: Graph Library & Editor 📋 PLANNED

**Goal**: Support a rich variety of graphs and allow custom graph creation.

| Milestone | Status |
|-----------|--------|
| K₄ (complete graph on 4 vertices) | 🔲 |
| Kₙ generator (complete graphs) | 🔲 |
| K_{m,n} generator (complete bipartite) | 🔲 |
| Platonic solid graphs | 🔲 |
| Cycle graphs Cₙ | 🔲 |
| Path graphs Pₙ | 🔲 |
| Laman graph examples | 🔲 |
| Interactive graph editor (add/remove nodes/edges) | 🔲 |
| Import from adjacency list/matrix | 🔲 |
| Export configurations (JSON, images) | 🔲 |

**Deliverable**: Graph selector UI and interactive editor for custom frameworks.

---

### Phase 7: Configuration Space Exploration ⚡ HIGH PRIORITY

**Goal**: Understand and visualize the configuration space of linkages to find dimension-folding paths.

**Core Research Question**: Given a linkage configuration, find a continuous path through configuration space to a minimal-dimensional embedding.

| Milestone | Status |
|-----------|--------|
| Configuration space info panel (product/intersection structure) | 🔲 |
| Pin node functionality (fix node, see reduced config space) | 🔲 |
| Special points identification (minimal dimension configurations) | 🔲 |
| Path-connectedness analysis between configurations | 🔲 |
| Folding path visualization in configuration space | 🔲 |
| Gradient descent to find minimal dimension configs | 🔲 |
| Connected component detection in config space | 🔲 |
| Topology of configuration space (genus, components) | 🔲 |

**Deliverable**: Tools to explore configuration space, find special points (minimal dimensions), and trace paths between configurations.

**Mathematical Framework**:
- Configuration space C = {p : ||p(u) - p(v)|| = L(e) ∀ edges e}
- C is the intersection of level sets of distance functions
- For path graph: C ≈ S² × S² (product of spheres)
- Special points: C_k ⊂ C where config lies in k-dimensional affine subspace
- Goal: Find path in C from generic point to C_k for minimal k

**Key Insight**: The spheres we already visualize ARE the configuration space! The folding motion is a path through this space. The intersection circles show where constraints overlap.

---

### Phase 8: Advanced Analysis 📋 FUTURE

**Goal**: Deeper mathematical exploration and research tools.

| Milestone | Status |
|-----------|--------|
| Matroid visualization (graphic matroid, rigidity matroid) | 🔲 |
| Stress analysis and self-stress display | 🔲 |
| Higher-dimensional embeddings (ℝ⁴ with projections) | 🔲 |
| Matroid operations (deletion, contraction) | 🔲 |
| Global rigidity analysis | 🔲 |
| Cayley-Menger determinant computation | 🔲 |
| Full configuration space topology visualization | 🔲 |

---

### Phase 9: Polish & Sharing 📋 FUTURE

**Goal**: Production-ready application with collaboration features.

| Milestone | Status |
|-----------|--------|
| Responsive layout for various screen sizes | 🔲 |
| Keyboard shortcuts | 🔲 |
| Undo/redo for editor operations | 🔲 |
| Shareable configuration URLs | 🔲 |
| Export animations (GIF, video) | 🔲 |
| Documentation and tutorials | 🔲 |
| Unit tests for mathematical functions | 🔲 |

---

## Current Priority: Phase 7 - Configuration Space Exploration

Phases 3-5 have substantial progress. The next frontier is **understanding and visualizing the configuration space** to find dimension-folding paths.

### Recommended Approach

1. **Add Configuration Space Panel**
   - Explain the product/intersection structure for current graph
   - Show how spheres and circles represent the configuration space

2. **Pin Node Functionality**
   - Let user fix a node and see how it constrains others
   - Visualize the fiber structure of the configuration space

3. **Special Points Detection**
   - Identify configurations at minimal dimension
   - Highlight when current config is a "special point"

4. **Path-Connectedness Tools**
   - Visualize folding paths as trajectories through configuration space
   - Detect when folding is impossible (disconnected components)

---

## Success Metrics

| Phase | Success Criteria |
|-------|------------------|
| Phase 3 | Edge lengths preserved during animation within 0.1% tolerance |
| Phase 4 | Correctly classify K₃ as rigid in ℝ², K₁,₂ as flexible |
| Phase 5 | Successfully fold K₁,₂ from ℝ² to ℝ¹ |
| Phase 6 | User can create arbitrary graph and analyze its rigidity |

---

## Technical Debt to Address

1. **Type Safety**: Several `@ts-expect-error` comments in graph utilities
2. **Performance**: Sphere geometry recreation on each update (should reuse geometry)
3. **Testing**: No automated tests for mathematical computations
4. **Accessibility**: Fixed canvas sizes, needs responsive design

---

## References for Implementation

- **Constraint Projection**: FABRIK algorithm, Position-Based Dynamics
- **Rigidity Analysis**: Connelly & Guest "Frameworks, Tensegrities, and Symmetry"
- **Matroid Theory**: Oxley "Matroid Theory"
- **Computational Geometry**: de Berg et al. "Computational Geometry"
