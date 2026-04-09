"use client";

interface ClueSlot {
  number: number;
  direction: "across" | "down";
  clue: string;
  answer: string;
  row: number;
  col: number;
  expectedLength: number;
}

interface ClueEditorProps {
  clueSlots: ClueSlot[];
  onUpdateClue: (
    number: number,
    direction: "across" | "down",
    field: "clue" | "answer",
    value: string
  ) => void;
}

export default function ClueEditor({ clueSlots, onUpdateClue }: ClueEditorProps) {
  const acrossSlots = clueSlots.filter((s) => s.direction === "across");
  const downSlots = clueSlots.filter((s) => s.direction === "down");

  const renderSlot = (slot: ClueSlot) => {
    const answerLen = slot.answer.length;
    const lenMatch = answerLen === slot.expectedLength;
    const hasAnswer = slot.answer.trim().length > 0;

    return (
      <div
        key={`${slot.number}-${slot.direction}`}
        className="border border-border rounded-lg p-3 space-y-2"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">
            {slot.number} {slot.direction === "across" ? "Across" : "Down"}
          </span>
          <span className="text-xs text-muted">
            ({slot.row + 1}, {slot.col + 1}) · {slot.expectedLength} letters
          </span>
        </div>

        <input
          type="text"
          placeholder="Enter clue text…"
          value={slot.clue}
          onChange={(e) =>
            onUpdateClue(slot.number, slot.direction, "clue", e.target.value)
          }
          className="w-full px-3 py-1.5 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        />

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="ANSWER"
            value={slot.answer}
            onChange={(e) =>
              onUpdateClue(
                slot.number,
                slot.direction,
                "answer",
                e.target.value.toUpperCase().replace(/[^A-Z]/g, "")
              )
            }
            maxLength={slot.expectedLength}
            className={`flex-1 px-3 py-1.5 border rounded-md text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-accent/30 ${
              hasAnswer && !lenMatch
                ? "border-red-300 bg-red-50"
                : hasAnswer && lenMatch
                ? "border-green-300 bg-green-50"
                : "border-border"
            }`}
          />
          <span
            className={`text-xs font-medium min-w-[3rem] text-right ${
              hasAnswer && !lenMatch ? "text-red-500" : "text-muted"
            }`}
          >
            {answerLen}/{slot.expectedLength}
          </span>
        </div>
      </div>
    );
  };

  if (clueSlots.length === 0) {
    return (
      <div className="text-center py-8 text-muted text-sm">
        <p>No words detected in the grid.</p>
        <p className="mt-1">Add white cells to create words (minimum 2 letters).</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {acrossSlots.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
            Across
          </h3>
          <div className="space-y-3">{acrossSlots.map(renderSlot)}</div>
        </div>
      )}

      {downSlots.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
            Down
          </h3>
          <div className="space-y-3">{downSlots.map(renderSlot)}</div>
        </div>
      )}
    </div>
  );
}
