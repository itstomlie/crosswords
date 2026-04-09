/**
 * Crossword grid auto-generator.
 * Given a list of words, arranges them into a crossword grid with maximal intersections.
 */

export interface PlacedWord {
  word: string;
  clue: string;
  row: number;
  col: number;
  direction: "across" | "down";
}

export interface GeneratedGrid {
  rows: number;
  cols: number;
  placements: PlacedWord[];
  grid: string[][]; // letter or '.' for black
}

interface Placement {
  word: string;
  clue: string;
  row: number;
  col: number;
  dir: "across" | "down";
  intersections: number;
}

/**
 * Generate a crossword layout from a list of {answer, clue} pairs.
 * Uses a greedy approach: place words one at a time, maximising intersections.
 */
export function generateCrosswordLayout(
  words: { answer: string; clue: string }[]
): GeneratedGrid | null {
  if (words.length === 0) return null;

  // Normalise and sort by length descending (longer words first = better structure)
  const sorted = words
    .map((w) => ({ answer: w.answer.toUpperCase().replace(/[^A-Z]/g, ""), clue: w.clue }))
    .filter((w) => w.answer.length >= 2)
    .sort((a, b) => b.answer.length - a.answer.length);

  if (sorted.length === 0) return null;

  // Working grid — dynamically sized via offset tracking
  const placed: Placement[] = [];

  // Place first word horizontally at origin
  placed.push({
    word: sorted[0].answer,
    clue: sorted[0].clue,
    row: 0,
    col: 0,
    dir: "across",
    intersections: 0,
  });

  // Place remaining words
  for (let i = 1; i < sorted.length; i++) {
    const candidate = sorted[i];
    const best = findBestPlacement(candidate.answer, candidate.clue, placed);
    if (best) {
      placed.push(best);
    } else {
      // If no intersection found, place isolated (will still be valid)
      const isolated = placeIsolated(candidate.answer, candidate.clue, placed);
      placed.push(isolated);
    }
  }

  // Normalise coordinates so all are >= 0
  let minRow = Infinity, minCol = Infinity;
  let maxRow = -Infinity, maxCol = -Infinity;

  for (const p of placed) {
    const endRow = p.dir === "down" ? p.row + p.word.length - 1 : p.row;
    const endCol = p.dir === "across" ? p.col + p.word.length - 1 : p.col;
    minRow = Math.min(minRow, p.row);
    minCol = Math.min(minCol, p.col);
    maxRow = Math.max(maxRow, endRow);
    maxCol = Math.max(maxCol, endCol);
  }

  // Add 1-cell padding
  minRow -= 1;
  minCol -= 1;
  maxRow += 1;
  maxCol += 1;

  const rows = maxRow - minRow + 1;
  const cols = maxCol - minCol + 1;

  // Build grid
  const grid: string[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ".")
  );

  const placements: PlacedWord[] = [];

  for (const p of placed) {
    const adjRow = p.row - minRow;
    const adjCol = p.col - minCol;

    placements.push({
      word: p.word,
      clue: p.clue,
      row: adjRow,
      col: adjCol,
      direction: p.dir,
    });

    for (let j = 0; j < p.word.length; j++) {
      const r = p.dir === "down" ? adjRow + j : adjRow;
      const c = p.dir === "across" ? adjCol + j : adjCol;
      grid[r][c] = p.word[j];
    }
  }

  return { rows, cols, placements, grid };
}

function findBestPlacement(
  word: string,
  clue: string,
  placed: Placement[]
): Placement | null {
  let best: Placement | null = null;
  let bestScore = -1;

  for (const existing of placed) {
    // Try to intersect with each placed word
    for (let ei = 0; ei < existing.word.length; ei++) {
      for (let wi = 0; wi < word.length; wi++) {
        if (existing.word[ei] !== word[wi]) continue;

        // The new word's direction must be perpendicular
        const newDir: "across" | "down" = existing.dir === "across" ? "down" : "across";

        let newRow: number, newCol: number;
        if (existing.dir === "across") {
          // Existing is across, new word goes down
          // Intersection point: existing at (existing.row, existing.col + ei)
          // New word char [wi] should be at that point
          newRow = existing.row - wi;
          newCol = existing.col + ei;
        } else {
          // Existing is down, new word goes across
          newRow = existing.row + ei;
          newCol = existing.col - wi;
        }

        // Check validity
        if (isValidPlacement(word, newRow, newCol, newDir, placed)) {
          // Count actual intersections with ALL placed words
          let intersections = 0;
          for (let j = 0; j < word.length; j++) {
            const r = newDir === "down" ? newRow + j : newRow;
            const c = newDir === "across" ? newCol + j : newCol;
            for (const p of placed) {
              for (let k = 0; k < p.word.length; k++) {
                const pr = p.dir === "down" ? p.row + k : p.row;
                const pc = p.dir === "across" ? p.col + k : p.col;
                if (pr === r && pc === c && p.word[k] === word[j]) {
                  intersections++;
                }
              }
            }
          }

          if (intersections > bestScore) {
            bestScore = intersections;
            best = { word, clue, row: newRow, col: newCol, dir: newDir, intersections };
          }
        }
      }
    }
  }

  return best;
}

function isValidPlacement(
  word: string,
  row: number,
  col: number,
  dir: "across" | "down",
  placed: Placement[]
): boolean {
  // Build a map of occupied cells
  const occupied = new Map<string, string>();
  for (const p of placed) {
    for (let i = 0; i < p.word.length; i++) {
      const r = p.dir === "down" ? p.row + i : p.row;
      const c = p.dir === "across" ? p.col + i : p.col;
      occupied.set(`${r},${c}`, p.word[i]);
    }
  }

  // Also track which cells are part of horizontal/vertical words
  const hCells = new Set<string>();
  const vCells = new Set<string>();
  for (const p of placed) {
    for (let i = 0; i < p.word.length; i++) {
      const r = p.dir === "down" ? p.row + i : p.row;
      const c = p.dir === "across" ? p.col + i : p.col;
      const key = `${r},${c}`;
      if (p.dir === "across") hCells.add(key);
      else vCells.add(key);
    }
  }

  for (let i = 0; i < word.length; i++) {
    const r = dir === "down" ? row + i : row;
    const c = dir === "across" ? col + i : col;
    const key = `${r},${c}`;
    const existing = occupied.get(key);

    if (existing) {
      // Cell occupied — must be same letter AND perpendicular
      if (existing !== word[i]) return false;
      // Can't overlap same direction
      if (dir === "across" && hCells.has(key)) return false;
      if (dir === "down" && vCells.has(key)) return false;
    } else {
      // Empty cell — check adjacency constraints
      // Parallel neighbors must not be occupied (prevents words running side-by-side)
      if (dir === "across") {
        // Check cells above and below
        const above = `${r - 1},${c}`;
        const below = `${r + 1},${c}`;
        if (occupied.has(above) && !isIntersectionWith(above, word[i], placed)) return false;
        if (occupied.has(below) && !isIntersectionWith(below, word[i], placed)) return false;
      } else {
        const left = `${r},${c - 1}`;
        const right = `${r},${c + 1}`;
        if (occupied.has(left) && !isIntersectionWith(left, word[i], placed)) return false;
        if (occupied.has(right) && !isIntersectionWith(right, word[i], placed)) return false;
      }
    }
  }

  // Check cells before and after the word (must be empty)
  if (dir === "across") {
    const before = `${row},${col - 1}`;
    const after = `${row},${col + word.length}`;
    if (occupied.has(before) || occupied.has(after)) return false;
  } else {
    const before = `${row - 1},${col}`;
    const after = `${row + word.length},${col}`;
    if (occupied.has(before) || occupied.has(after)) return false;
  }

  return true;
}

function isIntersectionWith(
  _key: string,
  _letter: string,
  _placed: Placement[]
): boolean {
  // Simplified: we already checked letter matches in the main loop
  return false;
}

function placeIsolated(
  word: string,
  clue: string,
  placed: Placement[]
): Placement {
  // Find bounds of current placements
  let maxRow = -Infinity;
  for (const p of placed) {
    const endRow = p.dir === "down" ? p.row + p.word.length - 1 : p.row;
    maxRow = Math.max(maxRow, endRow);
  }

  // Place 2 rows below the lowest existing word
  return {
    word,
    clue,
    row: maxRow + 2,
    col: 0,
    dir: "across",
    intersections: 0,
  };
}
