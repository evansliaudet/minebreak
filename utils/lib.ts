import { GameState } from "@/app/game/utils";
import { MutableRefObject } from "react";

export const calculateUpgradeCost = (level: number) => {
  return 200 + 700 * level;
};

export const calculateWorkerHireCost = (workerNb: number) => {
  return 200 + 900 * workerNb;
};

export const getMiningZone = (
  row: number,
  col: number,
  gridSize: number,
  gameStateRef: MutableRefObject<GameState | null>
) => {
  const state = gameStateRef.current;
  if (!state) return [{ row, col }];

  const level = state.pickaxe.level;
  const zone: { row: number; col: number }[] = [];

  // Always include the center
  zone.push({ row, col });

  if (level >= 5) {
    // Add top and bottom (3 vertical)
    zone.push({ row: row - 1, col });
    zone.push({ row: row + 1, col });
  }

  if (level >= 10) {
    // Add left and right (horizontal) for middle row
    zone.push({ row, col: col - 1 });
    zone.push({ row, col: col + 1 });
  }

  if (level >= 15) {
    // Complete 3x3 around center
    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) {
        if (!zone.find((z) => z.row === r && z.col === c)) {
          zone.push({ row: r, col: c });
        }
      }
    }
  }

  // Filter out-of-bounds tiles
  return zone.filter(
    (tile) =>
      tile.row >= 0 &&
      tile.row < gridSize &&
      tile.col >= 0 &&
      tile.col < gridSize
  );
};
