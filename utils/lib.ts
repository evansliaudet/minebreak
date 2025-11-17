import { GameState } from "@/app/game/utils";

export const calculateUpgradeCost = (level: number) => {
  return 200 + 700 * level;
};

export const calculateWorkerHireCost = (workerNb: number) => {
  return 200 + 900 * workerNb;
};

export const getTotalOreCount = (game: GameState) => {
  return Object.values(game.ores).reduce((sum, ore) => sum + ore.count, 0);
};
