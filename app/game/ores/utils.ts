import { Dispatch, SetStateAction } from "react";
import { GameState, OreKey } from "../utils";
import OreSprite from "@/types/OreSprite";
import { getTotalOreCount } from "@/utils/lib";
import OreType from "@/types/OreType";
import { MINING_CONFIG } from "../config";

export interface MiningScene extends Phaser.Scene {
  oreStates: number;
  oreTypes: OreType[];
  grid: OreSprite[][];
}

export function getWeightedRandomOre(
  scene: MiningScene,
  allowed?: OreKey[]
): OreType {
  const pool = allowed
    ? scene.oreTypes.filter((o) => allowed.includes(o.name as OreKey))
    : scene.oreTypes;

  const totalWeight = pool.reduce((sum, o) => sum + o.weight, 0);
  let random = Math.random() * totalWeight;

  for (const ore of pool) {
    random -= ore.weight;
    if (random <= 0) return ore;
  }

  return pool[pool.length - 1];
}

export const sellOres = (setGame: Dispatch<SetStateAction<GameState>>) => {
  setGame((prev) => {
    const totalCoins = Object.values(prev.smoltenOres).reduce(
      (sum, ore) => sum + ore.count * ore.price,
      0
    );

    const resetSmoltenOres = Object.fromEntries(
      Object.entries(prev.smoltenOres).map(([k, ore]) => [
        k,
        { ...ore, count: 0 },
      ])
    ) as GameState["smoltenOres"];

    return {
      ...prev,
      player: {
        ...prev.player,
        coins: prev.player.coins + totalCoins,
      },
      smoltenOres: resetSmoltenOres,
    };
  });
};

export function mineOre(
  scene: MiningScene,
  ore: OreSprite,
  gameStateRef: React.MutableRefObject<GameState | null>,
  setGame: React.Dispatch<React.SetStateAction<GameState>>
) {
  const state = gameStateRef.current;
  if (!state) return;

  const totalOres = getTotalOreCount(state);

  if (totalOres >= state.storage.cap) {
    const txt = scene.add
      .text(ore.x, ore.y - MINING_CONFIG.uiTextOffset, "Storage Full!", {
        font: "16px Arial",
        color: "#ff4444",
      })
      .setDepth(100);

    scene.time.addEvent({
      delay: 1000,
      callback: () => txt.destroy(),
    });
    return;
  }

  scene.tweens.add({
    targets: ore,
    yoyo: true,
    duration: MINING_CONFIG.mineTweenDuration,
  });

  ore.state++;

  if (ore.state >= scene.oreStates) {
    const oreType = scene.oreTypes[ore.typeRow];
    const oreKey = oreType.name as OreKey;

    setGame((prev: GameState) => {
      if (getTotalOreCount(prev) >= prev.storage.cap) return prev;
      return {
        ...prev,
        ores: {
          ...prev.ores,
          [oreKey]: {
            ...prev.ores[oreKey],
            count: prev.ores[oreKey].count + 1,
          },
        },
      };
    });

    const txt = scene.add.text(
      ore.x,
      ore.y - MINING_CONFIG.uiTextOffset,
      "+1",
      {
        font: "18px Arial",
        color: "#fff",
      }
    );

    scene.tweens.add({
      targets: txt,
      y: ore.y - MINING_CONFIG.uiFloatHeight,
      alpha: 0,
      duration: MINING_CONFIG.uiTextDuration,
      onComplete: () => txt.destroy(),
    });

    const newOre = getWeightedRandomOre(scene);
    ore.state = 0;
    ore.typeRow = newOre.row;
  }

  ore.setFrame(ore.typeRow * scene.oreStates + ore.state);
}

export function mineOresUnderPointer(
  scene: MiningScene,
  x: number,
  y: number,
  gameStateRef: React.MutableRefObject<GameState | null>,
  setGame: React.Dispatch<React.SetStateAction<GameState>>
) {
  for (const row of scene.grid) {
    for (const ore of row) {
      const dist = Phaser.Math.Distance.Between(x, y, ore.x, ore.y);

      if (dist < MINING_CONFIG.clickDistance) {
        mineOre(scene, ore, gameStateRef, setGame);
        return;
      }
    }
  }
}
