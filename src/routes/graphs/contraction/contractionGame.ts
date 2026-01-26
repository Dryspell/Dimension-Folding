// contractionGame.ts - Dimension Contraction Game logic
//
// A game where vertices are contracted based on edge relationships,
// building up to discover the minimal dimension of a linkage.

import Graph from "graphology";

/**
 * A cell in the contraction game.
 * Represents either a single vertex or a contracted group of vertices.
 */
export interface Cell {
  /** Unique ID for this cell */
  id: string;
  /** Vertex labels contained in this cell */
  vertices: string[];
  /** The dimension of this cell (vertices.length - 1, but may have special rules) */
  dimension: number;
  /** Color for display */
  color: string;
}

/**
 * State of the contraction game.
 */
export interface GameState {
  /** Current cells on the board */
  cells: Cell[];
  /** History of previous states (for undo) */
  history: Cell[][];
  /** Maximum dimension achieved so far */
  maxDimension: number;
  /** Is the game complete (no more valid contractions)? */
  isComplete: boolean;
  /** Explanation of current state */
  message: string;
}

/**
 * A potential contraction move.
 */
export interface ContractionMove {
  /** IDs of cells to contract */
  cellIds: string[];
  /** Resulting dimension after contraction */
  resultDimension: number;
  /** Whether this is a valid move (all vertices form a clique) */
  isValid: boolean;
  /** Reason if invalid */
  reason?: string;
}

// Color palette for cells
const CELL_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#22c55e", // green
  "#a855f7", // purple
  "#f97316", // orange
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#eab308", // yellow
];

let cellIdCounter = 0;

/**
 * Initialize a new game from a graph.
 * Each vertex becomes a cell with dimension 0.
 */
export function initializeGame(graph: Graph): GameState {
  cellIdCounter = 0;
  
  const cells: Cell[] = [];
  let colorIndex = 0;
  
  graph.forEachNode((nodeId, attrs) => {
    const label = (attrs.label as string) || nodeId;
    cells.push({
      id: `cell-${cellIdCounter++}`,
      vertices: [label],
      dimension: 0,
      color: CELL_COLORS[colorIndex % CELL_COLORS.length],
    });
    colorIndex++;
  });

  return {
    cells,
    history: [],
    maxDimension: 0,
    isComplete: cells.length <= 1,
    message: `Game started with ${cells.length} vertices. Select cells to contract.`,
  };
}

/**
 * Check if a set of vertices forms a complete subgraph (clique) in the graph.
 */
export function isClique(graph: Graph, vertexLabels: string[]): boolean {
  if (vertexLabels.length < 2) return true;

  // Build a map from labels to node IDs
  const labelToId: { [label: string]: string } = {};
  graph.forEachNode((nodeId, attrs) => {
    const label = (attrs.label as string) || nodeId;
    labelToId[label] = nodeId;
  });

  // Check all pairs
  for (let i = 0; i < vertexLabels.length; i++) {
    for (let j = i + 1; j < vertexLabels.length; j++) {
      const id1 = labelToId[vertexLabels[i]];
      const id2 = labelToId[vertexLabels[j]];
      
      if (!id1 || !id2) return false;
      
      // Check if edge exists (either direction for undirected)
      if (!graph.hasEdge(id1, id2) && !graph.hasEdge(id2, id1)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Get all valid contraction moves from current state.
 */
export function getValidMoves(graph: Graph, state: GameState): ContractionMove[] {
  const moves: ContractionMove[] = [];
  const cells = state.cells;

  // Check all pairs of cells
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      const combinedVertices = [...cells[i].vertices, ...cells[j].vertices];
      const isValid = isClique(graph, combinedVertices);
      const resultDimension = combinedVertices.length - 1;

      moves.push({
        cellIds: [cells[i].id, cells[j].id],
        resultDimension,
        isValid,
        reason: isValid ? undefined : "Missing edges between vertices",
      });
    }
  }

  // Also check for 3-cell contractions (for efficiency, only if all pairs are valid)
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      for (let k = j + 1; k < cells.length; k++) {
        const combinedVertices = [
          ...cells[i].vertices,
          ...cells[j].vertices,
          ...cells[k].vertices,
        ];
        const isValid = isClique(graph, combinedVertices);
        const resultDimension = combinedVertices.length - 1;

        if (isValid) {
          moves.push({
            cellIds: [cells[i].id, cells[j].id, cells[k].id],
            resultDimension,
            isValid: true,
          });
        }
      }
    }
  }

  return moves;
}

/**
 * Check if two cells can be contracted (share edge connections).
 */
export function canContract(graph: Graph, cell1: Cell, cell2: Cell): boolean {
  const combinedVertices = [...cell1.vertices, ...cell2.vertices];
  return isClique(graph, combinedVertices);
}

/**
 * Perform a contraction move.
 */
export function performContraction(
  graph: Graph,
  state: GameState,
  cellIds: string[]
): GameState {
  // Find the cells to contract
  const cellsToContract = state.cells.filter(c => cellIds.includes(c.id));
  const remainingCells = state.cells.filter(c => !cellIds.includes(c.id));

  if (cellsToContract.length < 2) {
    return {
      ...state,
      message: "Select at least 2 cells to contract.",
    };
  }

  // Check if contraction is valid
  const combinedVertices = cellsToContract.flatMap(c => c.vertices);
  if (!isClique(graph, combinedVertices)) {
    return {
      ...state,
      message: "Cannot contract: not all vertices are connected by edges.",
    };
  }

  // Create the new contracted cell
  const newDimension = combinedVertices.length - 1;
  const newCell: Cell = {
    id: `cell-${cellIdCounter++}`,
    vertices: combinedVertices,
    dimension: newDimension,
    color: cellsToContract[0].color, // Keep color of first cell
  };

  const newCells = [...remainingCells, newCell];
  const maxDimension = Math.max(state.maxDimension, newDimension);

  // Check if game is complete
  const validMoves = getValidMoves(graph, { ...state, cells: newCells });
  const hasValidMoves = validMoves.some(m => m.isValid);

  const dimensionName = getDimensionName(newDimension);
  const vertexList = combinedVertices.join(", ");

  return {
    cells: newCells,
    history: [...state.history, state.cells],
    maxDimension,
    isComplete: !hasValidMoves || newCells.length === 1,
    message: `Contracted {${vertexList}} → ${dimensionName}. Max dimension: ${maxDimension}.`,
  };
}

/**
 * Undo the last contraction.
 */
export function undoContraction(state: GameState): GameState {
  if (state.history.length === 0) {
    return { ...state, message: "Nothing to undo." };
  }

  const previousCells = state.history[state.history.length - 1];
  const newHistory = state.history.slice(0, -1);

  // Recalculate max dimension
  const maxDimension = Math.max(0, ...previousCells.map(c => c.dimension));

  return {
    cells: previousCells,
    history: newHistory,
    maxDimension,
    isComplete: false,
    message: "Undid last contraction.",
  };
}

/**
 * Reset the game to initial state.
 */
export function resetGame(graph: Graph): GameState {
  return initializeGame(graph);
}

/**
 * Get human-readable dimension name.
 */
export function getDimensionName(dim: number): string {
  switch (dim) {
    case 0: return "0D (point)";
    case 1: return "1D (edge)";
    case 2: return "2D (triangle)";
    case 3: return "3D (tetrahedron)";
    case 4: return "4D (5-cell)";
    default: return `${dim}D`;
  }
}

/**
 * Get the clique name for a dimension.
 */
export function getCliqueName(dim: number): string {
  const n = dim + 1;
  switch (n) {
    case 1: return "K₁";
    case 2: return "K₂";
    case 3: return "K₃";
    case 4: return "K₄";
    case 5: return "K₅";
    case 6: return "K₆";
    default: return `K${n}`;
  }
}

/**
 * Auto-solve: find the contraction sequence that maximizes dimension.
 * Uses greedy approach - always contract the largest valid clique.
 */
export function autoSolve(graph: Graph): { 
  finalDimension: number;
  steps: { contracted: string[]; dimension: number }[];
} {
  let state = initializeGame(graph);
  const steps: { contracted: string[]; dimension: number }[] = [];

  while (!state.isComplete) {
    const moves = getValidMoves(graph, state);
    const validMoves = moves.filter(m => m.isValid);

    if (validMoves.length === 0) break;

    // Pick the move with highest resulting dimension
    validMoves.sort((a, b) => b.resultDimension - a.resultDimension);
    const bestMove = validMoves[0];

    const cellsToContract = state.cells.filter(c => bestMove.cellIds.includes(c.id));
    const contracted = cellsToContract.flatMap(c => c.vertices);

    state = performContraction(graph, state, bestMove.cellIds);
    steps.push({
      contracted,
      dimension: bestMove.resultDimension,
    });
  }

  return {
    finalDimension: state.maxDimension,
    steps,
  };
}
