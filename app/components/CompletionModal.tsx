"use client";

interface CompletionModalProps {
  onPlayAgain: () => void;
}

export default function CompletionModal({ onPlayAgain }: CompletionModalProps) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Puzzle complete">
      <div className="modal-content">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Congratulations!
        </h2>
        <p className="text-muted mb-6">
          You&apos;ve successfully completed the crossword puzzle!
        </p>
        <button className="toolbar-btn primary text-base px-6 py-2.5" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
}
