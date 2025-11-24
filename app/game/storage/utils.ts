import { Dispatch, SetStateAction } from "react";
import { GameState } from "../utils";
import { calculateUpgradeCost } from "@/utils/lib";
import { STORAGE_CONFIG } from "../config";

export const upgradeStorage = ({
  game,
  setGame,
}: {
  game: GameState;
  setGame: Dispatch<SetStateAction<GameState>>;
}) => {
  if (game.storage.level == game.storage.maxLevel) {
    return;
  }

  setGame((prev) => {
    const cost = calculateUpgradeCost(prev.storage.level);
    if (prev.player.coins < cost) return prev;

    const newLevel = prev.storage.level + 1;
    const newStorageAmount = prev.storage.cap + STORAGE_CONFIG.capIncrement;

    return {
      ...prev,
      storage: {
        ...prev.storage,
        level: newLevel,
        cap: newStorageAmount,
      },
      player: {
        ...prev.player,
        coins: prev.player.coins - cost,
      },
    };
  });
};
