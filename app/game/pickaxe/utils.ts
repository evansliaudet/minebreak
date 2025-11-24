import { Dispatch, SetStateAction } from "react";
import { GameState } from "../utils";
import { calculateUpgradeCost } from "@/utils/lib";
import { PICKAXE_CONFIG } from "../config";

export const upgradePickaxe = (
  setGame: Dispatch<SetStateAction<GameState>>
) => {
  setGame((prev) => {
    const cost = calculateUpgradeCost(prev.pickaxe.level);
    if (prev.player.coins < cost) return prev;

    const newLevel = prev.pickaxe.level + 1;
    const newSpeed = prev.pickaxe.speed / PICKAXE_CONFIG.speedDivisor;

    return {
      ...prev,
      pickaxe: {
        ...prev.pickaxe,
        level: newLevel,
        speed: newSpeed,
      },
      player: {
        ...prev.player,
        coins: prev.player.coins - cost,
      },
    };
  });
};
