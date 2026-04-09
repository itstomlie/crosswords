// ── Puzzle data model ──────────────────────────────────────────────

export interface PuzzleCell {
  row: number;
  col: number;
  letter?: string;
  number?: number;
  black: boolean;
}

export interface Clue {
  number: number;
  clue: string;
  answer: string;
  row: number;
  col: number;
  length: number;
}

export interface PuzzleData {
  id: string;
  title: string;
  size: { rows: number; cols: number };
  cells: PuzzleCell[];
  clues: {
    across: Clue[];
    down: Clue[];
  };
}

export interface PuzzleManifestEntry {
  id: string;
  title: string;
}

// ── Player state types ─────────────────────────────────────────────

export type Direction = "across" | "down";

export interface CellPosition {
  row: number;
  col: number;
}

// ── Cell state used by the player grid ─────────────────────────────

export interface CellState {
  letter: string; // user-entered letter, or ""
  isBlack: boolean;
  number?: number;
  correctLetter?: string; // solution letter
  isChecked: boolean; // has been checked
  isIncorrect: boolean; // was wrong when checked
  isRevealed: boolean; // was revealed
}
