# Dimension Folding - Task List

> Granular, actionable tasks organized by category. Check items as completed.

---

## Legend

- 🔲 Not started
- 🚧 In progress
- ✅ Complete
- 🔴 Blocked / needs decision
- ⚡ High priority

---

## 1. Constraint-Preserving Motion ⚡

*Priority: HIGH - Foundation for dimension folding*

### 1.1 Edge Length Preservation

- [x] Create `constraintSolver.ts` module
- [x] Implement `computeEdgeLengths(graph, positions)` - returns map of edge → length
- [x] Implement `projectToConstraints(positions, edges, targetLengths, iterations)` - FABRIK-style solver
- [ ] Add constraint violation display (show current vs target edge lengths)
- [x] Implement tolerance parameter for constraint satisfaction (default: 0.001)
- [x] Add visual indicator when constraints are violated (edge color change via `getViolationColor`)

### 1.2 Motion Generation

- [ ] Replace current `Matrix4` transformations with constraint-preserving motion
- [x] Implement `computeFlexDirection(graph, positions)` - find valid flex directions (as `computeFlexDirections`)
- [ ] Implement single-vertex drag with constraint projection
- [x] Add "nudge" controls to move flexible vertex along valid path (as `nudgeWithConstraints`)
- [ ] Store and replay motion paths

### 1.3 Rigid vs Flexible Detection

- [x] Add `isRigid(graph, positions, dimension)` function (as `isInfinitesimallyRigid`)
- [x] Display rigid/flexible badge in UI
- [ ] Disable motion controls for rigid configurations
- [x] Show number of internal DOF

---

## 2. Rigidity Matrix Implementation

*Priority: HIGH - Required for rigidity analysis*

### 2.1 Matrix Computation

- [x] Implement `createRigidityMatrix(graph, coordinates)` in `matrixUtils.ts`
  - Input: Graph with n vertices, m edges; coordinates in ℝᵈ
  - Output: m × (d×n) matrix
  - Row for edge (u,v): [0,..., p(u)-p(v), ..., 0, ..., p(v)-p(u), ..., 0]
- [ ] Add unit tests for rigidity matrix on known graphs (K₃, K₄, V-graph)
- [x] Handle 2D vs 3D embeddings correctly

### 2.2 Matrix Analysis

- [x] Implement `computeMatrixRank(matrix)` - Gaussian elimination or SVD
- [x] Implement `computeNullSpace(matrix)` - infinitesimal motions
- [x] Compute expected rank: d|V| - d(d+1)/2
- [x] Compare actual vs expected rank for rigidity determination

### 2.3 UI Integration

- [x] Add "Rigidity" tab to matrix display panel
- [x] Display rigidity matrix with proper labeling
- [x] Show matrix rank
- [x] Show dimension of null space
- [x] Indicate trivial motions (rotation/translation)

---

## 3. Degrees of Freedom Calculation

### 3.1 DOF Computation

- [x] Implement `computeTrivialDOF(dimension)` - returns d(d+1)/2
- [x] Implement `computeInternalDOF(rank, vertices, dimension)` 
  - Formula: d|V| - trivial - rank(R)
- [x] Add DOF display to UI

### 3.2 DOF Visualization

- [ ] Visualize null space vectors as arrows on nodes
- [ ] Color-code vertices by mobility
- [ ] Animate along null space directions

---

## 4. Graph Library Expansion

*Priority: MEDIUM - More examples to explore*

### 4.1 Complete Graphs

- [x] Implement `createK4Graph()` - complete graph on 4 vertices
- [x] Implement `createKnGraph(n)` - generator for complete graphs
- [x] Ensure generic position for all node placements

### 4.2 Bipartite Graphs

- [x] Implement `createK23Graph()` - complete bipartite K_{2,3}
- [x] Implement `createKmnGraph(m, n)` - generator

### 4.3 Special Graphs

- [x] Implement cycle graphs `createCycleGraph(n)` - Cₙ
- [x] Implement path graphs `createPathGraph(n)` - Pₙ
- [x] Implement wheel graphs `createWheelGraph(n)`
- [x] Implement cube graph (Q₃)
- [x] Implement octahedron graph

### 4.4 Platonic Solids

- [ ] Tetrahedron (K₄ with 3D embedding)
- [ ] Cube skeleton
- [ ] Octahedron skeleton
- [ ] Dodecahedron skeleton
- [ ] Icosahedron skeleton

### 4.5 Laman Graphs

- [ ] Implement known minimally rigid 2D graphs
- [ ] Add Laman condition checker
- [ ] Highlight graphs that satisfy Laman's theorem

---

## 5. Graph Selector UI

- [x] Create `<GraphSelector>` component
- [x] Dropdown or tab-based graph selection
- [ ] Preview thumbnails for each graph type
- [x] Show graph properties (|V|, |E|, expected rigidity)
- [x] Hot-swap graph without page reload
- [ ] Remember last selected graph in localStorage

---

## 6. Interactive Graph Editor

*Priority: MEDIUM*

### 6.1 Node Operations

- [ ] Click to add node at position
- [ ] Double-click to delete node
- [ ] Drag node to reposition
- [ ] Node context menu (delete, change color, add edges)

### 6.2 Edge Operations

- [ ] Click two nodes to create edge
- [ ] Click edge to delete
- [ ] Edge weight/length display

### 6.3 Editor UI

- [ ] Tool palette (select, add node, add edge, delete)
- [ ] Clear all button
- [ ] Undo/redo stack
- [ ] Grid snap option

---

## 7. Dimension Folding Features

*Priority: HIGH - Core research goal*

### 7.1 Folding Analysis

- [x] Implement `canFoldToDimension(graph, positions, targetDim)` check
- [x] Implement `findMinimalDimension(graph)` algorithm (as `computeMinimalDimension`)
- [x] Add dimension indicator to UI (with tooltip showing explanation)

### 7.2 Folding Animation

- [x] Compute folding path from ℝ³ to ℝ² (when possible)
- [x] Compute folding path from ℝ² to ℝ¹ (when possible)
- [x] Animate continuous folding (with constraint preservation via FABRIK-style projection)
- [ ] Show target dimension plane/line in 3D view

### 7.3 Folding Visualization

- [ ] Side-by-side view: original vs folded
- [ ] Dimension slider (3D → 2D → 1D)
- [ ] Show folding trajectory in configuration space

---

## 8. Performance Optimizations

### 8.1 Three.js Optimization

- [ ] Reuse sphere geometries instead of recreating
- [ ] Implement geometry pooling for intersection visualization
- [ ] Use `InstancedMesh` for multiple similar objects
- [ ] Reduce polygon count for constraint spheres (32 segments → 16)
- [ ] Add level-of-detail (LOD) for complex scenes

### 8.2 Computation Optimization

- [ ] Cache rigidity matrix when graph topology unchanged
- [ ] Use Web Workers for heavy matrix computations
- [ ] Lazy computation of intersection circles

### 8.3 Reactivity Optimization

- [ ] Audit `createEffect` dependencies
- [ ] Batch signal updates where possible
- [ ] Profile with SolidJS DevTools

---

## 9. UI/UX Improvements

### 9.1 Responsive Design

- [ ] Make canvas sizes responsive (currently fixed 600×450)
- [ ] Mobile-friendly controls
- [ ] Collapsible panels for small screens

### 9.2 Accessibility

- [ ] Keyboard navigation for controls
- [ ] Screen reader labels
- [ ] High contrast mode option

### 9.3 Visual Polish

- [ ] Loading states for heavy computations
- [ ] Tooltips for all controls
- [ ] Better color scheme for constraint visualization
- [ ] Dark mode support

### 9.4 Playback Controls

- [x] Reset button (return to initial configuration)
- [ ] Step forward/backward (single transformation)
- [ ] Loop playback option
- [ ] Keyframe markers on timeline

---

## 10. Export & Sharing

- [ ] Export current configuration as JSON
- [ ] Import configuration from JSON
- [ ] Export 3D view as PNG/SVG
- [ ] Export animation as GIF
- [ ] Shareable URL with encoded configuration
- [ ] Copy matrices to clipboard (LaTeX format)

---

## 11. Documentation

### 11.1 Code Documentation

- [ ] JSDoc for all public functions in `matrixUtils.ts`
- [ ] JSDoc for all public functions in `threeUtils.ts`
- [ ] Document mathematical formulas in comments
- [ ] Add examples to complex functions

### 11.2 User Documentation

- [ ] Usage tutorial in README
- [ ] Mathematical background page in app
- [ ] Glossary of terms (already in README, link from app)
- [ ] Video walkthrough

---

## 12. Testing

### 12.1 Unit Tests

- [ ] Set up Vitest or Jest
- [ ] Test `createAdjacencyMatrix` on known graphs
- [ ] Test `createIncidenceMatrix` on known graphs
- [ ] Test rigidity matrix computation
- [ ] Test sphere intersection calculations
- [ ] Test constraint projection solver

### 12.2 Visual Regression Tests

- [ ] Screenshot testing for 2D canvas
- [ ] Snapshot testing for matrix displays

### 12.3 Integration Tests

- [ ] Test graph → visualization pipeline
- [ ] Test animation playback

---

## 13. Code Quality

### 13.1 Type Safety

- [x] Remove `@ts-expect-error` in `graphUtils.ts` (fix types properly)
- [ ] Add strict null checks
- [x] Create proper interface for graph node/edge attributes (NodeAttributes, EdgeAttributes, FrameworkGraph)

### 13.2 Refactoring

- [ ] Extract color constants to theme file
- [ ] Standardize graph attribute interface across files
- [ ] Create shared types file for common interfaces
- [ ] Split `ThreeJSGraph.tsx` into smaller components

### 13.3 Linting & Formatting

- [ ] Ensure ESLint is configured
- [ ] Add Prettier config
- [ ] Pre-commit hook for linting

---

## 14. Bug Fixes & Known Issues

- [ ] Timeline scrubbing position indicator slightly misaligned
- [ ] Intersection circles sometimes flicker during rapid animation
- [ ] Memory leak: sphere geometries not disposed on graph change
- [x] 2D canvas doesn't update when graph changes (fixed with createEffect)
- [x] Race condition: rigidity/dimension badges not updating on graph switch (fixed with hasAllCoordinates check)

---

## 15. Configuration Space Exploration ⚡

*Priority: HIGH - Core to understanding dimension folding*

### 15.1 Configuration Space Visualization

The configuration space C of a linkage is the set of all valid vertex positions satisfying edge length constraints. Understanding its structure is key to finding folding paths.

- [x] Add "Configuration Space" info panel explaining the structure for current graph
- [x] Show per-node configuration space analysis (sphere S², circle S¹, point)
- [x] Better label intersection circles as configuration space (cyan color)
- [x] Show DOF decomposition - how each node contributes to total DOF
- [ ] Visualize product structure: S² × S² for V-graph (two spheres, one per endpoint)
- [ ] Color-code nodes by their constraint degree (how many edges constrain them)

### 15.2 Pin Node Functionality

Allow user to "fix" a node and see how constraints on other nodes change.

- [ ] "Pin" button for each node (locks it in place)
- [ ] When node is pinned, update sphere visualizations to show reduced config space
- [ ] Show how pinning reduces DOF
- [ ] Visualize the fiber structure: for each position of pinned node, show valid positions of others

### 15.3 Special Points in Configuration Space

The key research goal: finding points in C where the linkage lies in a lower-dimensional subspace.

- [ ] Define C_k ⊂ C = configurations in k-dimensional affine subspace
- [ ] Implement `isInDimension(positions, k)` - check if config lies in k-dimensional subspace
- [ ] Highlight when current configuration is at a "special point" (minimal dimension)
- [ ] Visualize the boundary between C_3, C_2, C_1 regions in configuration space
- [ ] Mark folded configurations distinctly (stars, different colors)

### 15.4 Path-Connectedness Analysis

The fundamental question: is there a continuous path in C from current config to a lower-dimensional config?

- [ ] Implement `arePathConnected(config1, config2)` check
- [ ] Visualize path through configuration space during folding animation
- [ ] Detect and display connected components of C
- [ ] Show when folding is impossible (target dimension not reachable from current component)
- [ ] Compute and display the topology of C (genus, number of components)

### 15.5 Finding Minimal Dimension Configurations

Algorithms for finding the "special points" that represent minimal dimensions.

- [ ] Implement gradient descent on dimension-measuring function
- [ ] Sample configuration space to find low-dimensional regions
- [ ] Implement homotopy methods to trace paths to minimal dimension
- [ ] Store and catalog discovered minimal configurations
- [ ] Compare different paths to same minimal dimension

### 15.6 Theoretical Display

Help users understand the mathematical structure.

- [ ] Show configuration space as: C = {p : ||p(u) - p(v)|| = L(e) for all edges e}
- [ ] Display as intersection of level sets of distance functions
- [ ] Show product decomposition when applicable
- [ ] Explain fiber bundle structure over pinned configurations
- [ ] Link to relevant mathematical references (Connelly, Whiteley, etc.)

---

## 16. Future Research Features

*Lower priority - for advanced exploration*

- [ ] Matroid visualization (circuits, bases, rank function)
- [ ] Stress matrix computation and display
- [ ] Self-stress analysis for frameworks
- [ ] Cayley-Menger determinant for distance geometry
- [ ] Higher-dimensional projections (4D → 3D)
- [ ] Configuration space sampling and visualization
- [ ] Maxwell-Cremona correspondence (2D only)
- [ ] Global rigidity vs local rigidity analysis

---

## Quick Wins (< 1 hour each)

- [x] Add reset button to return to initial positions
- [x] Display edge count and vertex count in header
- [ ] Add link to README mathematical background from app
- [x] Show transformation name during playback
- [x] Add keyboard shortcut: Space for play/pause (also R for reset, arrows for direction)

---

## Blocked / Needs Decision

- 🔴 Which constraint solver algorithm? (FABRIK vs PBD vs gradient descent)
- 🔴 Support for weighted edges (variable bar lengths)?
- 🔴 Should we support directed graphs?
- 🔴 Target browsers/devices for responsive design?
