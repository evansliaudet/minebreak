import { Dispatch, SetStateAction } from "react";
import { OreKey, GameState } from "../utils";
import { calculateUpgradeCost } from "@/utils/lib";
import { FURNACE_CONFIG, ORE_ORDER } from "../config";

export const getNextOreToSmelt = (state: GameState): OreKey | null => {
  // Use the ORE_ORDER from config
  for (const oreKey of ORE_ORDER) {
    if (state.ores[oreKey].count > 0) {
      return oreKey;
    }
  }
  return null;
};

export interface Furnace {
  level: number;
  maxLevel: number;
  currentOre: OreKey | null;
  smeltStartTime: number | null;
  smeltDuration: number;
}

export const upgradeFurnace = ({
  game,
  setGame,
}: {
  game: GameState;
  setGame: Dispatch<SetStateAction<GameState>>;
}) => {
  if (game.furnace.level == game.furnace.maxLevel) {
    return;
  }

  setGame((prev) => {
    const cost =
      calculateUpgradeCost(prev.furnace.level) *
      FURNACE_CONFIG.upgradeCostMultiplier;
    if (prev.player.coins < cost) return prev;

    const newLevel = prev.furnace.level + 1;
    const newDuration = Math.max(
      FURNACE_CONFIG.minSmeltDuration,
      FURNACE_CONFIG.baseSmeltDuration /
        (newLevel * FURNACE_CONFIG.levelSpeedMultiplier)
    );

    return {
      ...prev,
      furnace: {
        ...prev.furnace,
        level: newLevel,
        smeltDuration: newDuration,
      },
      player: {
        ...prev.player,
        coins: prev.player.coins - cost,
      },
    };
  });
};
