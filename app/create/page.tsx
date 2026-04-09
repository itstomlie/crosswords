"use client";

import { useCallback, useRef } from "react";
import GridEditor from "../components/GridEditor";
import ClueEditor from "../components/ClueEditor";
import PuzzleValidator from "../components/PuzzleValidator";
import { usePuzzleEditor } from "../hooks/usePuzzleEditor";

export default function CreatePage() {
  const { state, actions } = usePuzzleEditor();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = useCallback(() => {
    const puzzle = actions.exportPuzzle();
    if (!puzzle) {
      alert("Fix validation errors before exporting.");
      return;
    }
    const json = JSON.stringify(puzzle, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${puzzle.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [actions]);

  const handlePreview = useCallback(() => {
    const puzzle = actions.exportPuzzle();
    if (!puzzle) {
      alert("Fix validation errors before previewing.");
      return;
    }
    // Store in sessionStorage and open player
    sessionStorage.setItem("preview-puzzle", JSON.stringify(puzzle));
    window.open("/play?puzzle=__preview__", "_blank");
  }, [actions]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          actions.importPuzzle(data);
        } catch {
          alert("Invalid JSON file.");
        }
      };
      reader.readAsText(file);
      // Reset input so same file can be loaded again
      e.target.value = "";
    },
    [actions]
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              ← All Puzzles
            </a>
            <h1 className="text-lg font-semibold">Puzzle Creator</h1>
          </div>

          <div className="flex items-center gap-2">
            <button className="toolbar-btn" onClick={handleImport}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Import
            </button>
            <button className="toolbar-btn" onClick={handlePreview}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Preview
            </button>
            <button className="toolbar-btn primary" onClick={handleExport}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Export JSON
            </button>
          </div>
        </div>
      </header>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full">
        {/* Title input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-muted mb-1">
            Puzzle Title
          </label>
          <input
            type="text"
            value={state.title}
            onChange={(e) => actions.setTitle(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            placeholder="e.g., Week 1 Vocabulary"
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Grid Editor */}
          <div className="flex-shrink-0">
            <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
              Grid Layout
            </h2>
            <GridEditor
              rows={state.rows}
              cols={state.cols}
              grid={state.grid}
              numberedPositions={state.numberedPositions}
              onToggleCell={actions.toggleCell}
              onUpdateDimensions={actions.updateDimensions}
            />

            {/* Validation */}
            <div className="mt-4">
              <PuzzleValidator errors={state.validationErrors} />
            </div>

            {/* Clear button */}
            <button
              className="toolbar-btn danger mt-4"
              onClick={() => {
                if (confirm("Clear the entire grid and all clues?")) {
                  actions.clearAll();
                }
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              </svg>
              Clear All
            </button>
          </div>

          {/* Right: Clue Editor */}
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
              Clues & Answers
            </h2>
            <ClueEditor
              clueSlots={state.clueSlots}
              onUpdateClue={actions.updateClue}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
