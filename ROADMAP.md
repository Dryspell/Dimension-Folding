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

### Phase 3: Motion Animation 🚧 IN PROGRESS

**Goal**: Animate linkages through their configuration space.

| Milestone | Status |
|-----------|--------|
| Timeline-based transformation playback | ✅ |
| Smooth interpolation between configurations | ✅ |
| Playback controls (play/pause, speed, direction) | ✅ |
| Scrubbing through transformation sequence | ✅ |
| Constraint-preserving motion (edge-length preservation) | 🔲 |
| Detection of rigid vs. flexible configurations | 🔲 |
| Motion path visualization | 🔲 |

**Deliverable**: Animate linkages along valid configuration paths while preserving bar lengths.

**Key Technical Challenge**: Current transformations (rotation, scale, translation) do NOT preserve edge lengths. Need to implement iterative constraint projection (e.g., FABRIK-style solver or gradient descent on constraint violations).

---

### Phase 4: Rigidity Analysis 📋 PLANNED

**Goal**: Compute and display rigidity properties of frameworks.

| Milestone | Status |
|-----------|--------|
| Rigidity matrix computation | 🔲 |
| Rigidity matrix display in UI | 🔲 |
| Matrix rank computation | 🔲 |
| Infinitesimal rigidity determination | 🔲 |
| Degrees of freedom (DOF) calculation | 🔲 |
| Null space visualization (infinitesimal motions) | 🔲 |
| Rigid component identification | 🔲 |
| Maxwell counting rule display | 🔲 |

**Deliverable**: Full rigidity analysis panel showing matrix, rank, DOF, and rigidity classification.

**Mathematical Foundation**:
- Rigidity matrix R: |E| × d|V| matrix of edge constraints
- Infinitesimally rigid iff rank(R) = d|V| - d(d+1)/2
- DOF = d|V| - d(d+1)/2 - rank(R)

---

### Phase 5: Dimension Folding 📋 PLANNED

**Goal**: Explore the central research question—finding minimal embedding dimensions.

| Milestone | Status |
|-----------|--------|
| Dimension reduction feasibility check | 🔲 |
| Folding path computation algorithm | 🔲 |
| Continuous folding animation | 🔲 |
| Minimal dimension display | 🔲 |
| Folding trajectory visualization | 🔲 |
| Dimension comparison view (side-by-side) | 🔲 |
| Stress-based folding heuristics | 🔲 |

**Deliverable**: Animate a linkage folding from ℝ³ to its minimal dimensional embedding.

**Research Questions to Address**:
1. What is the complexity of computing minimal folding dimension?
2. When is a framework "foldable" to a lower dimension?
3. Can we characterize graphs by their folding trajectories?

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

### Phase 7: Advanced Analysis 📋 FUTURE

**Goal**: Deeper mathematical exploration and research tools.

| Milestone | Status |
|-----------|--------|
| Matroid visualization (graphic matroid, rigidity matroid) | 🔲 |
| Stress analysis and self-stress display | 🔲 |
| Higher-dimensional embeddings (ℝ⁴ with projections) | 🔲 |
| Matroid operations (deletion, contraction) | 🔲 |
| Global rigidity analysis | 🔲 |
| Cayley-Menger determinant computation | 🔲 |
| Configuration space topology | 🔲 |

---

### Phase 8: Polish & Sharing 📋 FUTURE

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

## Current Priority: Phase 3 Completion

The immediate focus should be completing **constraint-preserving motion**. This is the foundation for all subsequent folding exploration.

### Recommended Approach

1. **Implement edge-length constraint projection**
   - Use iterative relaxation (FABRIK-style or position-based dynamics)
   - After each animation frame, project positions back to constraint manifold

2. **Add rigidity detection**
   - Compute rigidity matrix rank
   - Display rigid vs. flexible status

3. **Motion along DOF**
   - For flexible frameworks, compute null space of rigidity matrix
   - Allow motion only along infinitesimal flex directions

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
