"use client";

import { useCallback, useEffect, useRef } from "react";
import type { CellPosition, CellState, Direction, PuzzleData } from "../types";

interface CrosswordPlayerProps {
  puzzle: PuzzleData;
  grid: CellState[][];
  selectedCell: CellPosition | null;
  direction: Direction;
  currentWordCells: CellPosition[];
  onSelectCell: (row: number, col: number) => void;
  onTypeChar: (char: string) => void;
  onDeleteChar: () => void;
  onToggleDirection: () => void;
  onMoveDirection: (dr: number, dc: number) => void;
  onMoveToNextWord: () => void;
  onMoveToPrevWord: () => void;
}

export default function CrosswordPlayer({
  puzzle,
  grid,
  selectedCell,
  direction,
  currentWordCells,
  onSelectCell,
  onTypeChar,
  onDeleteChar,
  onToggleDirection,
  onMoveDirection,
  onMoveToNextWord,
  onMoveToPrevWord,
}: CrosswordPlayerProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  const isCellInWord = useCallback(
    (row: number, col: number) => {
      return currentWordCells.some((c) => c.row === row && c.col === col);
    },
    [currentWordCells]
  );

  const isCellSelected = useCallback(
    (row: number, col: number) => {
      return selectedCell?.row === row && selectedCell?.col === col;
    },
    [selectedCell]
  );

  // Keyboard handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if focus is on an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          onMoveDirection(-1, 0);
          break;
        case "ArrowDown":
          e.preventDefault();
          onMoveDirection(1, 0);
          break;
        case "ArrowLeft":
          e.preventDefault();
          onMoveDirection(0, -1);
          break;
        case "ArrowRight":
          e.preventDefault();
          onMoveDirection(0, 1);
          break;
        case " ":
          e.preventDefault();
          onToggleDirection();
          break;
        case "Backspace":
        case "Delete":
          e.preventDefault();
          onDeleteChar();
          break;
        case "Tab":
          e.preventDefault();
          if (e.shiftKey) {
            onMoveToPrevWord();
          } else {
            onMoveToNextWord();
          }
          break;
        default:
          if (e.key.length === 1 && /[a-zA-Z]/.test(e.key) && !e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            onTypeChar(e.key);
          }
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    onMoveDirection,
    onToggleDirection,
    onDeleteChar,
    onTypeChar,
    onMoveToNextWord,
    onMoveToPrevWord,
  ]);

  return (
    <div
      ref={gridRef}
      className="grid w-full min-w-[280px] max-w-[500px]"
      style={{
        gridTemplateColumns: `repeat(${puzzle.size.cols}, minmax(0, 1fr))`,
        gap: 0,
        border: `2px solid var(--grid-border)`,
      }}
      role="grid"
      aria-label="Crossword puzzle grid"
      tabIndex={0}
    >
      {grid.map((row, r) =>
        row.map((cell, c) => {
          const selected = isCellSelected(r, c);
          const inWord = isCellInWord(r, c);
          const isCorrect = cell.isChecked && !cell.isIncorrect;
          const isWrong = cell.isChecked && cell.isIncorrect;

          const classNames = [
            "crossword-cell",
            cell.isBlack ? "black" : "",
            selected ? "selected" : "",
            !cell.isBlack && inWord && !selected && !isCorrect && !isWrong
              ? "word-highlight"
              : "",
            isCorrect && !selected ? "checked-correct" : "",
            isWrong && !selected ? "checked-incorrect" : "",
            cell.isRevealed && !selected && !isCorrect && !isWrong
              ? "revealed"
              : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div
              key={`${r}-${c}`}
              className={classNames}
              onClick={() => onSelectCell(r, c)}
              role="gridcell"
              aria-label={
                cell.isBlack
                  ? "Black cell"
                  : `Row ${r + 1}, Column ${c + 1}${
                      cell.number ? `, number ${cell.number}` : ""
                    }${cell.letter ? `, letter ${cell.letter}` : ", empty"}`
              }
            >
              {!cell.isBlack && cell.number && (
                <span className="cell-number">{cell.number}</span>
              )}
              {!cell.isBlack && cell.letter}
            </div>
          );
        })
      )}
    </div>
  );
}
