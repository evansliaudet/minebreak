import { GameState } from "@/app/game/utils";
import { UPGRADE_CONFIG } from "@/app/game/config";

export const calculateUpgradeCost = (level: number) => {
  return UPGRADE_CONFIG.baseCost + UPGRADE_CONFIG.costMultiplier * level;
};

export const getTotalOreCount = (game: GameState) => {
  return Object.values(game.ores).reduce((sum, ore) => sum + ore.count, 0);
};
