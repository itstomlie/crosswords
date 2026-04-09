"use client";

import { useEffect, useState } from "react";
import type { PuzzleManifestEntry } from "./types";

export default function HomePage() {
  const [puzzles, setPuzzles] = useState<PuzzleManifestEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/puzzles/index.json")
      .then((res) => res.json())
      .then((data: PuzzleManifestEntry[]) => {
        setPuzzles(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-foreground">
            Crossword Puzzles
          </h1>
          <p className="text-muted mt-1 text-sm">
            Select a puzzle to play, or create your own.
          </p>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        {loading ? (
          <div className="text-muted text-center py-12">Loading puzzles…</div>
        ) : puzzles.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📝</div>
            <h2 className="text-lg font-semibold mb-2">No puzzles yet</h2>
            <p className="text-muted mb-4">
              Create your first crossword puzzle to get started.
            </p>
            <a href="/create" className="toolbar-btn primary">
              Create Puzzle
            </a>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {puzzles.map((puzzle) => (
                <a
                  key={puzzle.id}
                  href={`/play?puzzle=${puzzle.id}`}
                  className="group block border border-border rounded-xl p-5 hover:border-accent hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all duration-200">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M3 9h18" />
                        <path d="M3 15h18" />
                        <path d="M9 3v18" />
                        <path d="M15 3v18" />
                      </svg>
                    </div>
                    <svg
                      className="w-5 h-5 text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all duration-200"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="M12 5l7 7-7 7" />
                    </svg>
                  </div>
                  <h2 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                    {puzzle.title}
                  </h2>
                  <p className="text-sm text-muted mt-1">
                    Tap to play
                  </p>
                </a>
              ))}
            </div>

            {/* Create puzzle link */}
            <div className="mt-8 pt-6 border-t border-border">
              <a
                href="/create"
                className="group flex items-center gap-3 text-muted hover:text-accent transition-colors"
              >
                <div className="w-8 h-8 rounded-lg border-2 border-dashed border-current flex items-center justify-center group-hover:border-accent transition-colors">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                </div>
                <span className="text-sm font-medium">Create a new puzzle</span>
              </a>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
