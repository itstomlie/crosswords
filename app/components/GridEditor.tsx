"use client";

interface GridEditorProps {
  rows: number;
  cols: number;
  grid: { isBlack: boolean; letter: string }[][];
  numberedPositions: Array<{
    number: number;
    row: number;
    col: number;
  }>;
  onToggleCell: (row: number, col: number) => void;
  onUpdateDimensions: (rows: number, cols: number) => void;
}

export default function GridEditor({
  rows,
  cols,
  grid,
  numberedPositions,
  onToggleCell,
  onUpdateDimensions,
}: GridEditorProps) {
  const numberMap = new Map<string, number>();
  for (const p of numberedPositions) {
    numberMap.set(`${p.row},${p.col}`, p.number);
  }

  return (
    <div>
      {/* Dimension controls */}
      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted font-medium">Rows</span>
          <input
            type="number"
            min={3}
            max={25}
            value={rows}
            onChange={(e) => onUpdateDimensions(parseInt(e.target.value) || 3, cols)}
            className="w-16 px-2 py-1.5 border border-border rounded-md text-sm text-center focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
        </label>
        <span className="text-muted">×</span>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted font-medium">Cols</span>
          <input
            type="number"
            min={3}
            max={25}
            value={cols}
            onChange={(e) => onUpdateDimensions(rows, parseInt(e.target.value) || 3)}
            className="w-16 px-2 py-1.5 border border-border rounded-md text-sm text-center focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
        </label>
      </div>

      <p className="text-xs text-muted mb-3">Click cells to toggle black/white</p>

      {/* Grid */}
      <div
        className="inline-grid w-full max-w-[min(100%,450px)]"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 0,
          border: "2px solid var(--grid-border)",
        }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const num = numberMap.get(`${r},${c}`);
            return (
              <div
                key={`${r}-${c}`}
                className={`editor-cell ${cell.isBlack ? "black" : "white"}`}
                onClick={() => onToggleCell(r, c)}
                title={`Row ${r + 1}, Col ${c + 1}${num ? ` — #${num}` : ""}`}
              >
                {!cell.isBlack && num && (
                  <span className="cell-number">{num}</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
