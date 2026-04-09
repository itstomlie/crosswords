"use client";

interface ToolbarProps {
  onCheck: () => void;
  onRevealWord: () => void;
  onRevealAll: () => void;
  onClear: () => void;
}

export default function Toolbar({
  onCheck,
  onRevealWord,
  onRevealAll,
  onClear,
}: ToolbarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button className="toolbar-btn" onClick={onCheck} title="Check all entered letters">
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
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Check
      </button>

      <button
        className="toolbar-btn"
        onClick={onRevealWord}
        title="Reveal the current word"
      >
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
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        Reveal Word
      </button>

      <button
        className="toolbar-btn"
        onClick={onRevealAll}
        title="Reveal all answers"
      >
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
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18" />
          <path d="M3 15h18" />
          <path d="M9 3v18" />
          <path d="M15 3v18" />
        </svg>
        Reveal All
      </button>

      <button className="toolbar-btn danger" onClick={onClear} title="Clear all entries">
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
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
        </svg>
        Clear
      </button>
    </div>
  );
}
