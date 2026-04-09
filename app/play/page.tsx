"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { PuzzleData } from "../types";
import CrosswordPlayer from "../components/CrosswordPlayer";
import ClueList from "../components/ClueList";
import Toolbar from "../components/Toolbar";
import CompletionModal from "../components/CompletionModal";
import { useCrossword } from "../hooks/useCrossword";

function PlayContent() {
  const searchParams = useSearchParams();
  const puzzleId = searchParams.get("puzzle");
  const isEmbed = searchParams.get("embed") === "true";

  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!puzzleId) {
      setError("No puzzle specified. Add ?puzzle=week1 to the URL.");
      setLoading(false);
      return;
    }

    // Preview mode: load from sessionStorage
    if (puzzleId === "__preview__") {
      try {
        const raw = sessionStorage.getItem("preview-puzzle");
        if (!raw) throw new Error("No preview data found");
        setPuzzle(JSON.parse(raw) as PuzzleData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Preview failed");
      }
      setLoading(false);
      return;
    }

    fetch(`/puzzles/${puzzleId}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Puzzle "${puzzleId}" not found`);
        return res.json();
      })
      .then((data: PuzzleData) => {
        setPuzzle(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [puzzleId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted text-lg">Loading puzzle…</div>
      </div>
    );
  }

  if (error || !puzzle) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">😕</div>
          <h2 className="text-xl font-semibold mb-2">Puzzle not found</h2>
          <p className="text-muted">{error}</p>
        </div>
      </div>
    );
  }

  return <PuzzlePlayer puzzle={puzzle} isEmbed={isEmbed} />;
}

function PuzzlePlayer({
  puzzle,
  isEmbed,
}: {
  puzzle: PuzzleData;
  isEmbed: boolean;
}) {
  const { state, actions, derived } = useCrossword(puzzle);

  const handleSelectClue = useCallback(
    (clue: { row: number; col: number }, dir: "across" | "down") => {
      actions.selectClue(clue, dir);
    },
    [actions]
  );

  return (
    <div className={`flex-1 flex flex-col ${isEmbed ? "" : "min-h-screen"}`}>
      {/* Header - hidden in embed mode */}
      {!isEmbed && (
        <header className="border-b border-border px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <a href="/" className="text-sm font-medium text-muted hover:text-foreground transition-colors">
              ← All Puzzles
            </a>
            <h1 className="text-lg font-semibold">{puzzle.title}</h1>
            <div className="w-20" />
          </div>
        </header>
      )}

      {/* Active clue banner */}
      <div className="bg-accent-light border-b border-accent/20 px-4 py-2.5">
        <div className="max-w-6xl mx-auto">
          {derived.activeClue ? (
            <p className="text-sm font-medium text-foreground">
              <span className="text-accent font-bold mr-1.5">
                {derived.activeClue.number}
                {state.direction === "across" ? "A" : "D"}
              </span>
              {derived.activeClue.clue}
            </p>
          ) : (
            <p className="text-sm text-muted">Click a cell to begin</p>
          )}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 px-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Toolbar */}
          <div className="mb-4">
            <Toolbar
              onCheck={actions.checkGrid}
              onRevealWord={actions.revealWord}
              onRevealAll={actions.revealAll}
              onClear={actions.clearGrid}
            />
          </div>

          {/* Grid + Clues layout */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Grid */}
            <div className="flex-shrink-0 w-full max-w-[500px]">
              <CrosswordPlayer
                puzzle={puzzle}
                grid={state.grid}
                selectedCell={state.selectedCell}
                direction={state.direction}
                currentWordCells={derived.currentWordCells}
                onSelectCell={actions.selectCell}
                onTypeChar={actions.typeChar}
                onDeleteChar={actions.deleteChar}
                onToggleDirection={actions.toggleDirection}
                onMoveDirection={actions.moveDirection}
                onMoveToNextWord={actions.moveToNextWord}
                onMoveToPrevWord={actions.moveToPrevWord}
              />
            </div>

            {/* Clues */}
            <div className="flex-1 min-w-0">
              <ClueList
                acrossClues={puzzle.clues.across}
                downClues={puzzle.clues.down}
                activeClue={derived.activeClue}
                direction={state.direction}
                onSelectClue={handleSelectClue}
              />
            </div>
          </div>

          {/* Direction indicator */}
          <div className="mt-3 text-xs text-muted">
            Direction:{" "}
            <span className="font-semibold text-foreground">
              {state.direction === "across" ? "Across →" : "Down ↓"}
            </span>
            <span className="ml-2">(Press Space to toggle)</span>
          </div>
        </div>
      </main>

      {/* Completion modal */}
      {state.isComplete && <CompletionModal onPlayAgain={actions.clearGrid} />}
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-screen">
          <div className="text-muted text-lg">Loading…</div>
        </div>
      }
    >
      <PlayContent />
    </Suspense>
  );
}
