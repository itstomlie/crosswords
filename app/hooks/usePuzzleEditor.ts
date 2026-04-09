"use client";

import { useCallback, useMemo, useState } from "react";
import type { Clue, PuzzleCell, PuzzleData } from "../types";

interface EditorCell {
  isBlack: boolean;
  letter: string;
}

interface ClueEntry {
  number: number;
  direction: "across" | "down";
  clue: string;
  answer: string;
  row: number;
  col: number;
  expectedLength: number;
}

interface ValidationError {
  type: "error" | "warning";
  message: string;
}

export function usePuzzleEditor() {
  const [rows, setRows] = useState(7);
  const [cols, setCols] = useState(7);
  const [title, setTitle] = useState("New Puzzle");
  const [grid, setGrid] = useState<EditorCell[][]>(() => createEmptyGrid(7, 7));
  const [clueEntries, setClueEntries] = useState<Map<string, { clue: string; answer: string }>>(
    new Map()
  );

  function createEmptyGrid(r: number, c: number): EditorCell[][] {
    return Array.from({ length: r }, () =>
      Array.from({ length: c }, () => ({ isBlack: false, letter: "" }))
    );
  }

  const updateDimensions = useCallback((newRows: number, newCols: number) => {
    const r = Math.max(3, Math.min(25, newRows));
    const c = Math.max(3, Math.min(25, newCols));
    setRows(r);
    setCols(c);
    setGrid((prev) => {
      const newGrid: EditorCell[][] = [];
      for (let row = 0; row < r; row++) {
        newGrid[row] = [];
        for (let col = 0; col < c; col++) {
          newGrid[row][col] = prev[row]?.[col] ?? { isBlack: false, letter: "" };
        }
      }
      return newGrid;
    });
  }, []);

  const toggleCell = useCallback((row: number, col: number) => {
    setGrid((prev) => {
      const next = prev.map((r) => r.map((c) => ({ ...c })));
      next[row][col].isBlack = !next[row][col].isBlack;
      if (next[row][col].isBlack) {
        next[row][col].letter = "";
      }
      return next;
    });
  }, []);

  const isBlack = useCallback(
    (r: number, c: number): boolean => {
      if (r < 0 || r >= rows || c < 0 || c >= cols) return true;
      return grid[r][c].isBlack;
    },
    [grid, rows, cols]
  );

  // Auto-numbering based on standard crossword rules
  const numberedPositions = useMemo(() => {
    const positions: Array<{
      number: number;
      row: number;
      col: number;
      startsAcross: boolean;
      startsDown: boolean;
      acrossLength: number;
      downLength: number;
    }> = [];

    let num = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c].isBlack) continue;

        const leftBlack = c === 0 || grid[r][c - 1].isBlack;
        const rightNotBlack = c + 1 < cols && !grid[r][c + 1].isBlack;
        const topBlack = r === 0 || grid[r - 1][c].isBlack;
        const bottomNotBlack = r + 1 < rows && !grid[r + 1][c].isBlack;

        const startsAcross = leftBlack && rightNotBlack;
        const startsDown = topBlack && bottomNotBlack;

        if (startsAcross || startsDown) {
          let acrossLen = 0;
          if (startsAcross) {
            let cc = c;
            while (cc < cols && !grid[r][cc].isBlack) {
              acrossLen++;
              cc++;
            }
          }

          let downLen = 0;
          if (startsDown) {
            let rr = r;
            while (rr < rows && !grid[rr][c].isBlack) {
              downLen++;
              rr++;
            }
          }

          positions.push({
            number: num,
            row: r,
            col: c,
            startsAcross,
            startsDown,
            acrossLength: acrossLen,
            downLength: downLen,
          });
          num++;
        }
      }
    }
    return positions;
  }, [grid, rows, cols]);

  // Build clue entries for the form
  const clueSlots = useMemo((): ClueEntry[] => {
    const entries: ClueEntry[] = [];
    for (const pos of numberedPositions) {
      if (pos.startsAcross) {
        const key = `${pos.number}-across`;
        const existing = clueEntries.get(key);
        entries.push({
          number: pos.number,
          direction: "across",
          clue: existing?.clue ?? "",
          answer: existing?.answer ?? "",
          row: pos.row,
          col: pos.col,
          expectedLength: pos.acrossLength,
        });
      }
      if (pos.startsDown) {
        const key = `${pos.number}-down`;
        const existing = clueEntries.get(key);
        entries.push({
          number: pos.number,
          direction: "down",
          clue: existing?.clue ?? "",
          answer: existing?.answer ?? "",
          row: pos.row,
          col: pos.col,
          expectedLength: pos.downLength,
        });
      }
    }
    return entries;
  }, [numberedPositions, clueEntries]);

  const updateClue = useCallback(
    (number: number, direction: "across" | "down", field: "clue" | "answer", value: string) => {
      setClueEntries((prev) => {
        const next = new Map(prev);
        const key = `${number}-${direction}`;
        const existing = next.get(key) ?? { clue: "", answer: "" };
        next.set(key, { ...existing, [field]: value });
        return next;
      });
    },
    []
  );

  // Validation
  const validationErrors = useMemo((): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Check for orphan cells
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c].isBlack) continue;
        const hasH = !isBlack(r, c - 1) || !isBlack(r, c + 1);
        const hasV = !isBlack(r - 1, c) || !isBlack(r + 1, c);
        if (!hasH && !hasV) {
          errors.push({
            type: "error",
            message: `Orphan cell at row ${r + 1}, col ${c + 1} — not part of any word`,
          });
        }
      }
    }

    // Check clue entries
    for (const slot of clueSlots) {
      if (!slot.clue.trim()) {
        errors.push({
          type: "warning",
          message: `${slot.number} ${slot.direction}: missing clue text`,
        });
      }
      if (!slot.answer.trim()) {
        errors.push({
          type: "warning",
          message: `${slot.number} ${slot.direction}: missing answer`,
        });
      } else if (slot.answer.length !== slot.expectedLength) {
        errors.push({
          type: "error",
          message: `${slot.number} ${slot.direction}: answer "${slot.answer}" is ${slot.answer.length} letters, expected ${slot.expectedLength}`,
        });
      }
    }

    return errors;
  }, [grid, rows, cols, clueSlots, isBlack]);

  // Export to PuzzleData JSON
  const exportPuzzle = useCallback((): PuzzleData | null => {
    const hasErrors = validationErrors.some((e) => e.type === "error");
    if (hasErrors) return null;

    const cells: PuzzleCell[] = [];
    const numberMap = new Map<string, number>();
    for (const pos of numberedPositions) {
      numberMap.set(`${pos.row},${pos.col}`, pos.number);
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell: PuzzleCell = {
          row: r,
          col: c,
          black: grid[r][c].isBlack,
        };
        if (!cell.black) {
          const num = numberMap.get(`${r},${c}`);
          if (num) cell.number = num;
          // Find letter from clue answers
          // For each across clue covering this cell, get the letter
          for (const slot of clueSlots) {
            if (slot.direction === "across" && slot.row === r) {
              const offset = c - slot.col;
              if (offset >= 0 && offset < slot.expectedLength && slot.answer[offset]) {
                cell.letter = slot.answer[offset].toUpperCase();
              }
            }
            if (slot.direction === "down" && slot.col === c) {
              const offset = r - slot.row;
              if (offset >= 0 && offset < slot.expectedLength && slot.answer[offset]) {
                cell.letter = slot.answer[offset].toUpperCase();
              }
            }
          }
        }
        cells.push(cell);
      }
    }

    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const acrossClues: Clue[] = clueSlots
      .filter((s) => s.direction === "across")
      .map((s) => ({
        number: s.number,
        clue: s.clue,
        answer: s.answer.toUpperCase(),
        row: s.row,
        col: s.col,
        length: s.expectedLength,
      }));

    const downClues: Clue[] = clueSlots
      .filter((s) => s.direction === "down")
      .map((s) => ({
        number: s.number,
        clue: s.clue,
        answer: s.answer.toUpperCase(),
        row: s.row,
        col: s.col,
        length: s.expectedLength,
      }));

    return {
      id,
      title,
      size: { rows, cols },
      cells,
      clues: { across: acrossClues, down: downClues },
    };
  }, [title, rows, cols, grid, numberedPositions, clueSlots, validationErrors]);

  const importPuzzle = useCallback((puzzle: PuzzleData) => {
    setTitle(puzzle.title);
    setRows(puzzle.size.rows);
    setCols(puzzle.size.cols);

    const newGrid: EditorCell[][] = Array.from({ length: puzzle.size.rows }, () =>
      Array.from({ length: puzzle.size.cols }, () => ({ isBlack: true, letter: "" }))
    );

    for (const cell of puzzle.cells) {
      newGrid[cell.row][cell.col] = {
        isBlack: cell.black,
        letter: cell.letter ?? "",
      };
    }

    setGrid(newGrid);

    const newClues = new Map<string, { clue: string; answer: string }>();
    for (const clue of puzzle.clues.across) {
      newClues.set(`${clue.number}-across`, { clue: clue.clue, answer: clue.answer });
    }
    for (const clue of puzzle.clues.down) {
      newClues.set(`${clue.number}-down`, { clue: clue.clue, answer: clue.answer });
    }
    setClueEntries(newClues);
  }, []);

  const clearAll = useCallback(() => {
    setGrid(createEmptyGrid(rows, cols));
    setClueEntries(new Map());
    setTitle("New Puzzle");
  }, [rows, cols]);

  return {
    state: { rows, cols, title, grid, numberedPositions, clueSlots, validationErrors },
    actions: { updateDimensions, toggleCell, updateClue, setTitle, exportPuzzle, importPuzzle, clearAll },
  };
}
