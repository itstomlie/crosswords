"use client";

import { useCallback, useMemo, useState } from "react";
import type { CellPosition, CellState, Clue, Direction, PuzzleData } from "../types";

export interface CrosswordState {
  grid: CellState[][];
  selectedCell: CellPosition | null;
  direction: Direction;
  isComplete: boolean;
}

export interface CrosswordActions {
  selectCell: (row: number, col: number) => void;
  typeChar: (char: string) => void;
  deleteChar: () => void;
  toggleDirection: () => void;
  moveDirection: (dr: number, dc: number) => void;
  moveToPrevWord: () => void;
  moveToNextWord: () => void;
  checkGrid: () => void;
  revealWord: () => void;
  revealAll: () => void;
  clearGrid: () => void;
}

export interface CrosswordDerived {
  currentWordCells: CellPosition[];
  activeClue: Clue | null;
}

function buildGrid(puzzle: PuzzleData): CellState[][] {
  const grid: CellState[][] = [];
  for (let r = 0; r < puzzle.size.rows; r++) {
    grid[r] = [];
    for (let c = 0; c < puzzle.size.cols; c++) {
      grid[r][c] = {
        letter: "",
        isBlack: true,
        isChecked: false,
        isIncorrect: false,
        isRevealed: false,
      };
    }
  }
  for (const cell of puzzle.cells) {
    grid[cell.row][cell.col] = {
      letter: "",
      isBlack: cell.black,
      number: cell.number,
      correctLetter: cell.letter,
      isChecked: false,
      isIncorrect: false,
      isRevealed: false,
    };
  }
  return grid;
}

function getWordCells(
  puzzle: PuzzleData,
  grid: CellState[][],
  pos: CellPosition,
  dir: Direction
): CellPosition[] {
  const { rows, cols } = puzzle.size;
  const cells: CellPosition[] = [];

  if (grid[pos.row]?.[pos.col]?.isBlack) return cells;

  if (dir === "across") {
    // Find start of word
    let startCol = pos.col;
    while (startCol > 0 && !grid[pos.row][startCol - 1].isBlack) startCol--;
    // Collect word
    let c = startCol;
    while (c < cols && !grid[pos.row][c].isBlack) {
      cells.push({ row: pos.row, col: c });
      c++;
    }
  } else {
    // Find start of word
    let startRow = pos.row;
    while (startRow > 0 && !grid[startRow - 1][pos.col].isBlack) startRow--;
    // Collect word
    let r = startRow;
    while (r < rows && !grid[r][pos.col].isBlack) {
      cells.push({ row: r, col: pos.col });
      r++;
    }
  }

  return cells;
}

function findClueForCell(
  puzzle: PuzzleData,
  grid: CellState[][],
  pos: CellPosition,
  dir: Direction
): Clue | null {
  const wordCells = getWordCells(puzzle, grid, pos, dir);
  if (wordCells.length === 0) return null;

  const start = wordCells[0];
  const clueList = dir === "across" ? puzzle.clues.across : puzzle.clues.down;
  return clueList.find((c) => c.row === start.row && c.col === start.col) ?? null;
}

function findFirstWhiteCell(grid: CellState[][]): CellPosition | null {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (!grid[r][c].isBlack) return { row: r, col: c };
    }
  }
  return null;
}

export function useCrossword(puzzle: PuzzleData) {
  const [grid, setGrid] = useState<CellState[][]>(() => buildGrid(puzzle));
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(() =>
    findFirstWhiteCell(buildGrid(puzzle))
  );
  const [direction, setDirection] = useState<Direction>("across");
  const [isComplete, setIsComplete] = useState(false);

  const checkCompletion = useCallback(
    (g: CellState[][]) => {
      for (const cell of puzzle.cells) {
        if (cell.black) continue;
        const cs = g[cell.row][cell.col];
        if (!cs.correctLetter || cs.letter.toUpperCase() !== cs.correctLetter.toUpperCase()) {
          return false;
        }
      }
      return true;
    },
    [puzzle]
  );

  const currentWordCells = useMemo(() => {
    if (!selectedCell) return [];
    return getWordCells(puzzle, grid, selectedCell, direction);
  }, [puzzle, grid, selectedCell, direction]);

  const activeClue = useMemo(() => {
    if (!selectedCell) return null;
    return findClueForCell(puzzle, grid, selectedCell, direction);
  }, [puzzle, grid, selectedCell, direction]);

  const selectCell = useCallback(
    (row: number, col: number) => {
      if (grid[row]?.[col]?.isBlack) return;
      // If clicking same cell, toggle direction
      if (selectedCell?.row === row && selectedCell?.col === col) {
        setDirection((d) => (d === "across" ? "down" : "across"));
      } else {
        setSelectedCell({ row, col });
      }
    },
    [grid, selectedCell]
  );

  const moveToNextCell = useCallback(
    (g: CellState[][], pos: CellPosition, dir: Direction): CellPosition => {
      const { rows, cols } = puzzle.size;
      if (dir === "across") {
        let nc = pos.col + 1;
        while (nc < cols && g[pos.row][nc].isBlack) nc++;
        if (nc < cols) return { row: pos.row, col: nc };
      } else {
        let nr = pos.row + 1;
        while (nr < rows && g[nr][pos.col].isBlack) nr++;
        if (nr < rows) return { row: nr, col: pos.col };
      }
      return pos;
    },
    [puzzle.size]
  );

  const moveToPrevCell = useCallback(
    (pos: CellPosition, dir: Direction): CellPosition => {
      if (dir === "across") {
        let nc = pos.col - 1;
        while (nc >= 0 && grid[pos.row][nc].isBlack) nc--;
        if (nc >= 0) return { row: pos.row, col: nc };
      } else {
        let nr = pos.row - 1;
        while (nr >= 0 && grid[nr][pos.col].isBlack) nr--;
        if (nr >= 0) return { row: nr, col: pos.col };
      }
      return pos;
    },
    [grid]
  );

  const typeChar = useCallback(
    (char: string) => {
      if (!selectedCell || isComplete) return;
      const upper = char.toUpperCase();
      if (!/^[A-Z]$/.test(upper)) return;

      setGrid((prev) => {
        const next = prev.map((row) => row.map((c) => ({ ...c })));
        next[selectedCell.row][selectedCell.col].letter = upper;
        next[selectedCell.row][selectedCell.col].isChecked = false;
        next[selectedCell.row][selectedCell.col].isIncorrect = false;

        if (checkCompletion(next)) {
          setIsComplete(true);
        }

        // Advance cursor
        const nextPos = moveToNextCell(next, selectedCell, direction);
        setSelectedCell(nextPos);

        return next;
      });
    },
    [selectedCell, direction, isComplete, checkCompletion, moveToNextCell]
  );

  const deleteChar = useCallback(() => {
    if (!selectedCell || isComplete) return;

    setGrid((prev) => {
      const next = prev.map((row) => row.map((c) => ({ ...c })));
      const current = next[selectedCell.row][selectedCell.col];

      if (current.letter) {
        // Delete current letter
        current.letter = "";
        current.isChecked = false;
        current.isIncorrect = false;
      } else {
        // Move back and delete
        const prevPos = moveToPrevCell(selectedCell, direction);
        if (prevPos.row !== selectedCell.row || prevPos.col !== selectedCell.col) {
          next[prevPos.row][prevPos.col].letter = "";
          next[prevPos.row][prevPos.col].isChecked = false;
          next[prevPos.row][prevPos.col].isIncorrect = false;
          setSelectedCell(prevPos);
        }
      }
      return next;
    });
  }, [selectedCell, direction, isComplete, moveToPrevCell]);

  const toggleDirection = useCallback(() => {
    setDirection((d) => (d === "across" ? "down" : "across"));
  }, []);

  const moveDirection = useCallback(
    (dr: number, dc: number) => {
      if (!selectedCell) return;
      const { rows, cols } = puzzle.size;
      let nr = selectedCell.row + dr;
      let nc = selectedCell.col + dc;

      // Skip black cells
      while (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].isBlack) {
        nr += dr;
        nc += dc;
      }

      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !grid[nr][nc].isBlack) {
        setSelectedCell({ row: nr, col: nc });
        // Update direction based on arrow key
        if (dc !== 0) setDirection("across");
        if (dr !== 0) setDirection("down");
      }
    },
    [selectedCell, puzzle.size, grid]
  );

  const getAllClues = useCallback(
    (dir: Direction): Clue[] => {
      return dir === "across" ? puzzle.clues.across : puzzle.clues.down;
    },
    [puzzle]
  );

  const moveToNextWord = useCallback(() => {
    const clues = getAllClues(direction);
    if (!activeClue || clues.length === 0) return;
    const idx = clues.findIndex((c) => c.number === activeClue.number);
    let nextIdx = (idx + 1) % clues.length;
    // If we wrap around, switch direction
    if (nextIdx === 0) {
      const otherDir = direction === "across" ? "down" : "across";
      const otherClues = getAllClues(otherDir);
      if (otherClues.length > 0) {
        setDirection(otherDir);
        setSelectedCell({ row: otherClues[0].row, col: otherClues[0].col });
        return;
      }
    }
    const next = clues[nextIdx];
    setSelectedCell({ row: next.row, col: next.col });
  }, [direction, activeClue, getAllClues]);

  const moveToPrevWord = useCallback(() => {
    const clues = getAllClues(direction);
    if (!activeClue || clues.length === 0) return;
    const idx = clues.findIndex((c) => c.number === activeClue.number);
    let prevIdx = idx - 1;
    if (prevIdx < 0) {
      const otherDir = direction === "across" ? "down" : "across";
      const otherClues = getAllClues(otherDir);
      if (otherClues.length > 0) {
        setDirection(otherDir);
        setSelectedCell({
          row: otherClues[otherClues.length - 1].row,
          col: otherClues[otherClues.length - 1].col,
        });
        return;
      }
      prevIdx = clues.length - 1;
    }
    const prev = clues[prevIdx];
    setSelectedCell({ row: prev.row, col: prev.col });
  }, [direction, activeClue, getAllClues]);

  const checkGrid = useCallback(() => {
    setGrid((prev) => {
      const next = prev.map((row) => row.map((c) => ({ ...c })));
      for (let r = 0; r < next.length; r++) {
        for (let c = 0; c < next[r].length; c++) {
          const cell = next[r][c];
          if (cell.isBlack || !cell.letter || cell.isRevealed) continue;
          cell.isChecked = true;
          cell.isIncorrect =
            cell.letter.toUpperCase() !== (cell.correctLetter ?? "").toUpperCase();
        }
      }
      return next;
    });
  }, []);

  const revealWord = useCallback(() => {
    if (!selectedCell) return;
    const wordCells = getWordCells(puzzle, grid, selectedCell, direction);

    setGrid((prev) => {
      const next = prev.map((row) => row.map((c) => ({ ...c })));
      for (const pos of wordCells) {
        const cell = next[pos.row][pos.col];
        if (cell.correctLetter) {
          cell.letter = cell.correctLetter;
          cell.isRevealed = true;
          cell.isChecked = false;
          cell.isIncorrect = false;
        }
      }
      if (checkCompletion(next)) setIsComplete(true);
      return next;
    });
  }, [selectedCell, direction, puzzle, grid, checkCompletion]);

  const revealAll = useCallback(() => {
    setGrid((prev) => {
      const next = prev.map((row) => row.map((c) => ({ ...c })));
      for (let r = 0; r < next.length; r++) {
        for (let c = 0; c < next[r].length; c++) {
          const cell = next[r][c];
          if (cell.isBlack || !cell.correctLetter) continue;
          cell.letter = cell.correctLetter;
          cell.isRevealed = true;
          cell.isChecked = false;
          cell.isIncorrect = false;
        }
      }
      setIsComplete(true);
      return next;
    });
  }, []);

  const clearGrid = useCallback(() => {
    setGrid(buildGrid(puzzle));
    setIsComplete(false);
    setSelectedCell(findFirstWhiteCell(buildGrid(puzzle)));
    setDirection("across");
  }, [puzzle]);

  const selectClue = useCallback((clue: { row: number; col: number }, dir: Direction) => {
    setSelectedCell({ row: clue.row, col: clue.col });
    setDirection(dir);
  }, []);

  return {
    state: { grid, selectedCell, direction, isComplete },
    actions: {
      selectCell,
      typeChar,
      deleteChar,
      toggleDirection,
      moveDirection,
      moveToNextWord,
      moveToPrevWord,
      checkGrid,
      revealWord,
      revealAll,
      clearGrid,
      selectClue,
    },
    derived: { currentWordCells, activeClue },
  };
}
