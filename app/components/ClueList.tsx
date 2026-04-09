"use client";

import { useEffect, useRef } from "react";
import type { Clue, Direction } from "../types";

interface ClueListProps {
  acrossClues: Clue[];
  downClues: Clue[];
  activeClue: Clue | null;
  direction: Direction;
  onSelectClue: (clue: Clue, direction: Direction) => void;
}

export default function ClueList({
  acrossClues,
  downClues,
  activeClue,
  direction,
  onSelectClue,
}: ClueListProps) {
  const activeRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active clue
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeClue, direction]);

  const renderClueSection = (
    title: string,
    clues: Clue[],
    dir: Direction
  ) => (
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2 px-1">
        {title}
      </h3>
      <div className="clue-scroll space-y-0.5 max-h-[300px] overflow-y-auto pr-1 lg:max-h-[calc(100vh-300px)]">
        {clues.map((clue) => {
          const isActive =
            activeClue?.number === clue.number && direction === dir;
          return (
            <div
              key={`${dir}-${clue.number}`}
              ref={isActive ? activeRef : undefined}
              className={`clue-item ${isActive ? "active" : ""}`}
              onClick={() => onSelectClue(clue, dir)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectClue(clue, dir);
                }
              }}
            >
              <span className="font-semibold text-foreground mr-1.5">
                {clue.number}.
              </span>
              <span className="text-foreground/80">{clue.clue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      {renderClueSection("Across", acrossClues, "across")}
      {renderClueSection("Down", downClues, "down")}
    </div>
  );
}
