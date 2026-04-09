"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generateCrosswordLayout } from "../lib/crosswordGenerator";
import { generateCluesForTopic, generateCluesForAnswers } from "../lib/openai";
import GridEditor from "../components/GridEditor";
import ClueEditor from "../components/ClueEditor";
import PuzzleValidator from "../components/PuzzleValidator";
import { usePuzzleEditor } from "../hooks/usePuzzleEditor";
import type { Clue, PuzzleCell, PuzzleData } from "../types";

// ── Simple mode types ──────────────────────────────────────────────

interface WordEntry {
  id: string;
  answer: string;
  clue: string;
}

let nextId = 1;
function makeId() {
  return `w_${nextId++}`;
}

// ── Simple mode (words-first + AI) ─────────────────────────────────

function SimpleMode() {
  const [title, setTitle] = useState("New Puzzle");
  const [words, setWords] = useState<WordEntry[]>([
    { id: makeId(), answer: "", clue: "" },
  ]);
  const [apiKey, setApiKey] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("openai-api-key");
    if (saved) setApiKey(saved);
  }, []);

  useEffect(() => {
    if (apiKey) localStorage.setItem("openai-api-key", apiKey);
  }, [apiKey]);

  const updateWord = useCallback(
    (id: string, field: "answer" | "clue", value: string) => {
      setWords((prev) =>
        prev.map((w) =>
          w.id === id
            ? {
                ...w,
                [field]:
                  field === "answer"
                    ? value.toUpperCase().replace(/[^A-Z]/g, "")
                    : value,
              }
            : w
        )
      );
    },
    []
  );

  const addWord = useCallback(() => {
    setWords((prev) => [...prev, { id: makeId(), answer: "", clue: "" }]);
  }, []);

  const removeWord = useCallback((id: string) => {
    setWords((prev) => (prev.length <= 1 ? prev : prev.filter((w) => w.id !== id)));
  }, []);

  const validWords = useMemo(
    () => words.filter((w) => w.answer.length >= 2),
    [words]
  );

  const layout = useMemo(() => {
    if (validWords.length === 0) return null;
    return generateCrosswordLayout(
      validWords.map((w) => ({ answer: w.answer, clue: w.clue }))
    );
  }, [validWords]);

  const gridNumbers = useMemo(() => {
    if (!layout) return new Map<string, number>();
    const isBlack = (r: number, c: number) =>
      r < 0 || r >= layout.rows || c < 0 || c >= layout.cols || layout.grid[r][c] === ".";
    const nums = new Map<string, number>();
    let num = 1;
    for (let r = 0; r < layout.rows; r++) {
      for (let c = 0; c < layout.cols; c++) {
        if (isBlack(r, c)) continue;
        const sa = isBlack(r, c - 1) && !isBlack(r, c + 1);
        const sd = isBlack(r - 1, c) && !isBlack(r + 1, c);
        if (sa || sd) { nums.set(`${r},${c}`, num); num++; }
      }
    }
    return nums;
  }, [layout]);

  // AI handlers
  const handleGenerateFromTopic = useCallback(async () => {
    if (!apiKey.trim()) { setAiError("Enter your OpenAI API key first"); return; }
    if (!aiTopic.trim()) { setAiError("Enter a topic"); return; }
    setAiLoading(true);
    setAiError(null);
    try {
      const generated = await generateCluesForTopic(apiKey, aiTopic, 8);
      setWords(generated.map((g) => ({ id: makeId(), answer: g.answer, clue: g.clue })));
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Generation failed");
    } finally { setAiLoading(false); }
  }, [apiKey, aiTopic]);

  const handleGenerateClues = useCallback(async () => {
    if (!apiKey.trim()) { setAiError("Enter your OpenAI API key first"); return; }
    const answersToGenerate = words.filter((w) => w.answer.length >= 2 && !w.clue.trim()).map((w) => w.answer);
    if (answersToGenerate.length === 0) { setAiError("All words already have clues"); return; }
    setAiLoading(true);
    setAiError(null);
    try {
      const clueMap = await generateCluesForAnswers(apiKey, answersToGenerate);
      setWords((prev) => prev.map((w) => {
        const generated = clueMap.get(w.answer);
        return generated && !w.clue.trim() ? { ...w, clue: generated } : w;
      }));
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Generation failed");
    } finally { setAiLoading(false); }
  }, [apiKey, words]);

  // Export
  const exportPuzzle = useCallback((): PuzzleData | null => {
    if (!layout) return null;
    const cells: PuzzleCell[] = [];
    for (let r = 0; r < layout.rows; r++) {
      for (let c = 0; c < layout.cols; c++) {
        const letter = layout.grid[r][c];
        cells.push({ row: r, col: c, black: letter === ".", letter: letter !== "." ? letter : undefined, number: gridNumbers.get(`${r},${c}`) });
      }
    }
    const acrossClues: Clue[] = [];
    const downClues: Clue[] = [];
    for (const p of layout.placements) {
      const num = gridNumbers.get(`${p.row},${p.col}`);
      if (!num) continue;
      const clue: Clue = { number: num, clue: p.clue || `Clue for ${p.word}`, answer: p.word, row: p.row, col: p.col, length: p.word.length };
      if (p.direction === "across") acrossClues.push(clue);
      else downClues.push(clue);
    }
    acrossClues.sort((a, b) => a.number - b.number);
    downClues.sort((a, b) => a.number - b.number);
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "puzzle";
    return { id, title, size: { rows: layout.rows, cols: layout.cols }, cells, clues: { across: acrossClues, down: downClues } };
  }, [layout, gridNumbers, title]);

  const handleExport = useCallback(() => {
    const puzzle = exportPuzzle();
    if (!puzzle) { alert("Add at least 2 words to generate a puzzle."); return; }
    const json = JSON.stringify(puzzle, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${puzzle.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportPuzzle]);

  const handlePreview = useCallback(() => {
    const puzzle = exportPuzzle();
    if (!puzzle) { alert("Add at least 2 words to generate a puzzle."); return; }
    sessionStorage.setItem("preview-puzzle", JSON.stringify(puzzle));
    window.open("/play?puzzle=__preview__", "_blank");
  }, [exportPuzzle]);

  const handleImport = useCallback(() => fileInputRef.current?.click(), []);
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string) as PuzzleData;
          setTitle(data.title);
          const allClues = [...data.clues.across, ...data.clues.down];
          setWords(allClues.map((c) => ({ id: makeId(), answer: c.answer, clue: c.clue })));
        } catch { alert("Invalid JSON file."); }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    []
  );

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-6">
        <button className="toolbar-btn" onClick={handleImport}>Import</button>
        <button className="toolbar-btn" onClick={handlePreview}>Preview</button>
        <button className="toolbar-btn primary" onClick={handleExport}>Export JSON</button>
      </div>
      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />

      {/* Title */}
      <div className="mb-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-border rounded-lg text-base font-semibold focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          placeholder="Puzzle title…"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* LEFT: Sticky Grid Preview */}
        <div className="lg:w-[55%] xl:w-[60%] flex-shrink-0">
          <div className="lg:sticky lg:top-4">
            <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
              Grid Preview
              {layout && (
                <span className="text-xs font-normal text-muted">
                  {layout.rows}×{layout.cols} · {layout.placements.length} words
                </span>
              )}
            </h2>

            {layout ? (
              <div className="max-h-[60vh] overflow-auto">
                <div
                  className="grid w-full"
                  style={{
                    gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))`,
                    gap: 0,
                    border: "2px solid var(--grid-border)",
                    maxWidth: `${Math.min(layout.cols * 48, 600)}px`,
                  }}
                >
                  {layout.grid.map((row, r) =>
                    row.map((letter, c) => {
                      const num = gridNumbers.get(`${r},${c}`);
                      const isBlack = letter === ".";
                      return (
                        <div
                          key={`${r}-${c}`}
                          className={`editor-cell ${isBlack ? "black" : "white"}`}
                          style={{ minHeight: "28px" }}
                        >
                          {!isBlack && num && <span className="cell-number">{num}</span>}
                          {!isBlack && (
                            <span className="text-[clamp(0.55rem,1.5vw,0.8rem)] font-semibold text-accent/70">
                              {letter}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-xl p-12 text-center text-muted">
                <div className="text-3xl mb-2">🧩</div>
                <p className="text-sm">Add words to see the grid preview</p>
              </div>
            )}

            {/* Placement summary */}
            {layout && (
              <div className="mt-3 space-y-0.5 max-h-[200px] overflow-auto">
                {layout.placements.map((p, i) => (
                  <div key={i} className="text-xs text-muted flex items-center gap-2">
                    <span className="font-semibold text-foreground min-w-[3ch] text-right">
                      {gridNumbers.get(`${p.row},${p.col}`) ?? "?"}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${p.direction === "across" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                      {p.direction === "across" ? "A" : "D"}
                    </span>
                    <span className="font-mono tracking-wider">{p.word}</span>
                    {p.clue && <span className="text-muted/60 truncate">— {p.clue}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Word List + AI */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* AI Section */}
          <div className="border border-border rounded-xl p-4 bg-gradient-to-br from-accent/5 to-transparent">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a7 7 0 017 7c0 3-2 5.5-4 7l-3 3.5L9 16c-2-1.5-4-4-4-7a7 7 0 017-7z" />
                <circle cx="12" cy="9" r="2" />
              </svg>
              AI Generate
            </h3>
            <div className="mb-3">
              <label className="block text-xs text-muted mb-1">OpenAI API Key</label>
              <div className="flex gap-2">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="flex-1 px-3 py-1.5 border border-border rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
                <button type="button" className="toolbar-btn text-xs px-2" onClick={() => setShowApiKey((v) => !v)}>
                  {showApiKey ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="Topic (e.g., Photosynthesis)"
                className="flex-1 px-3 py-1.5 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                onKeyDown={(e) => { if (e.key === "Enter") handleGenerateFromTopic(); }}
              />
              <button className="toolbar-btn primary text-xs whitespace-nowrap" onClick={handleGenerateFromTopic} disabled={aiLoading}>
                {aiLoading ? "Generating…" : "Generate Words"}
              </button>
            </div>
            <button className="toolbar-btn text-xs w-full justify-center" onClick={handleGenerateClues} disabled={aiLoading}>
              {aiLoading ? "Generating…" : "Auto-generate missing clues"}
            </button>
            {aiError && <p className="text-xs text-red-500 mt-2">{aiError}</p>}
          </div>

          {/* Word list */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
              Words & Clues ({validWords.length} valid)
            </h2>
            <div className="space-y-3">
              {words.map((w, i) => (
                <div key={w.id} className="border border-border rounded-lg p-3 group hover:border-accent/30 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-muted w-5 text-right">{i + 1}</span>
                    <input
                      type="text"
                      value={w.answer}
                      onChange={(e) => updateWord(w.id, "answer", e.target.value)}
                      placeholder="ANSWER"
                      className="flex-1 px-3 py-1.5 border border-border rounded-md text-sm font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                    <span className={`text-xs font-medium min-w-[2rem] text-right ${w.answer.length >= 2 ? "text-green-600" : "text-muted"}`}>
                      {w.answer.length}
                    </span>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-red-500 p-1" onClick={() => removeWord(w.id)} title="Remove">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5" />
                    <input
                      type="text"
                      value={w.clue}
                      onChange={(e) => updateWord(w.id, "clue", e.target.value)}
                      placeholder="Clue text…"
                      className="flex-1 px-3 py-1.5 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                  </div>
                </div>
              ))}
            </div>
            <button className="toolbar-btn mt-3 w-full justify-center" onClick={addWord}>
              + Add Word
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Advanced mode (manual grid editor) ─────────────────────────────

function AdvancedMode() {
  const { state, actions } = usePuzzleEditor();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = useCallback(() => {
    const puzzle = actions.exportPuzzle();
    if (!puzzle) { alert("Fix validation errors before exporting."); return; }
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
    if (!puzzle) { alert("Fix validation errors before previewing."); return; }
    sessionStorage.setItem("preview-puzzle", JSON.stringify(puzzle));
    window.open("/play?puzzle=__preview__", "_blank");
  }, [actions]);

  const handleImport = useCallback(() => fileInputRef.current?.click(), []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          actions.importPuzzle(data);
        } catch { alert("Invalid JSON file."); }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [actions]
  );

  return (
    <>
      <div className="flex items-center gap-2 mb-6">
        <button className="toolbar-btn" onClick={handleImport}>Import</button>
        <button className="toolbar-btn" onClick={handlePreview}>Preview</button>
        <button className="toolbar-btn primary" onClick={handleExport}>Export JSON</button>
      </div>
      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />

      <div className="mb-6">
        <label className="block text-sm font-medium text-muted mb-1">Puzzle Title</label>
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
        <div className="lg:w-[50%] flex-shrink-0">
          <div className="lg:sticky lg:top-4">
            <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Grid Layout</h2>
            <GridEditor
              rows={state.rows}
              cols={state.cols}
              grid={state.grid}
              numberedPositions={state.numberedPositions}
              onToggleCell={actions.toggleCell}
              onUpdateDimensions={actions.updateDimensions}
            />
            <div className="mt-4">
              <PuzzleValidator errors={state.validationErrors} />
            </div>
            <button
              className="toolbar-btn danger mt-4"
              onClick={() => { if (confirm("Clear everything?")) actions.clearAll(); }}
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Right: Clue Editor */}
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Clues & Answers</h2>
          <ClueEditor clueSlots={state.clueSlots} onUpdateClue={actions.updateClue} />
        </div>
      </div>
    </>
  );
}

// ── Main Create Page ───────────────────────────────────────────────

export default function CreatePage() {
  const [mode, setMode] = useState<"simple" | "advanced">("simple");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm font-medium text-muted hover:text-foreground transition-colors">
              ← All Puzzles
            </a>
            <h1 className="text-lg font-semibold">Puzzle Creator</h1>
          </div>

          {/* Mode toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                mode === "simple"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
              onClick={() => setMode("simple")}
            >
              Simple
            </button>
            <button
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                mode === "advanced"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
              onClick={() => setMode("advanced")}
            >
              Advanced
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] mx-auto px-4 py-6 w-full">
        {mode === "simple" ? <SimpleMode /> : <AdvancedMode />}
      </main>
    </div>
  );
}
