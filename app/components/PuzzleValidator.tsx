"use client";

interface ValidationError {
  type: "error" | "warning";
  message: string;
}

interface PuzzleValidatorProps {
  errors: ValidationError[];
}

export default function PuzzleValidator({ errors }: PuzzleValidatorProps) {
  if (errors.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Puzzle is valid and ready to export
      </div>
    );
  }

  const errorItems = errors.filter((e) => e.type === "error");
  const warningItems = errors.filter((e) => e.type === "warning");

  return (
    <div className="space-y-3">
      {errorItems.length > 0 && (
        <div className="border border-red-200 bg-red-50 rounded-lg px-4 py-3">
          <h4 className="text-sm font-semibold text-red-700 mb-1.5 flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            Errors ({errorItems.length})
          </h4>
          <ul className="text-xs text-red-600 space-y-0.5">
            {errorItems.map((e, i) => (
              <li key={i}>• {e.message}</li>
            ))}
          </ul>
        </div>
      )}

      {warningItems.length > 0 && (
        <div className="border border-amber-200 bg-amber-50 rounded-lg px-4 py-3">
          <h4 className="text-sm font-semibold text-amber-700 mb-1.5 flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Warnings ({warningItems.length})
          </h4>
          <ul className="text-xs text-amber-600 space-y-0.5">
            {warningItems.map((e, i) => (
              <li key={i}>• {e.message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
