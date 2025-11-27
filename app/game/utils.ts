import { Dispatch, SetStateAction } from "react";
import { Furnace } from "./furnace/utils";
import WorkerType from "@/types/WorkerType";
import { FURNACE_CONFIG, PICKAXE_CONFIG, STORAGE_CONFIG } from "./config";

export type OreKey = "ore1" | "ore2" | "ore3" | "ore4" | "ore5" | "ore6";

export type SmoltenOreKey =
  | "smolten_ore1"
  | "smolten_ore2"
  | "smolten_ore3"
  | "smolten_ore4"
  | "smolten_ore5"
  | "smolten_ore6";

export interface GameState {
  player: { coins: number; lightning: number };
  pickaxe: { level: number; speed: number };
  storage: { cap: number; level: number; maxLevel: number };
  furnace: Furnace;
  workerStamina: { level: number };
  workerCycle: { isResting: boolean; phaseStartTime: number };
  workers: WorkerType[];
  ores: Record<
    OreKey,
    { row: number; count: number; icon: string; price: number }
  >;
  smoltenOres: Record<
    SmoltenOreKey,
    { count: number; icon: string; price: number }
  >;
}

export const createDefaultGameState = (): GameState => ({
  player: { coins: 0, lightning: 1 },
  pickaxe: { level: 0, speed: PICKAXE_CONFIG.baseSpeed },
  storage: {
    cap: STORAGE_CONFIG.baseCap,
    level: STORAGE_CONFIG.baseLevel,
    maxLevel: STORAGE_CONFIG.maxLevel,
  },
  furnace: {
    level: 1,
    maxLevel: FURNACE_CONFIG.maxLevel,
    currentOre: null,
    smeltStartTime: null,
    smeltDuration: FURNACE_CONFIG.baseSmeltDuration,
  },
  workerStamina: { level: 1 },
  workerCycle: { isResting: false, phaseStartTime: Date.now() },
  ores: {
    ore1: { row: 0, count: 0, icon: "purple", price: 1 },
    ore2: { row: 1, count: 0, icon: "green", price: 3 },
    ore3: { row: 2, count: 0, icon: "black", price: 10 },
    ore4: { row: 3, count: 0, icon: "red", price: 25 },
    ore5: { row: 4, count: 0, icon: "diamond", price: 50 },
    ore6: { row: 5, count: 0, icon: "red_shade", price: 120 },
  },
  smoltenOres: {
    smolten_ore1: {
      count: 0,
      price: 1,
      icon: "smolten_purple",
    },
    smolten_ore2: { count: 0, price: 3, icon: "smolten_green" },
    smolten_ore3: { count: 0, price: 10, icon: "smolten_black" },
    smolten_ore4: { count: 0, price: 25, icon: "smolten_red" },
    smolten_ore5: {
      count: 0,
      price: 50,
      icon: "smolten_diamond",
    },
    smolten_ore6: {
      count: 0,
      price: 120,
      icon: "smolten_dark_red",
    },
  },
  workers: [],
});

export const loadSavedGame = (): GameState => {
  if (typeof window === "undefined") return createDefaultGameState();

  const saved = localStorage.getItem("gameState");
  if (!saved) return createDefaultGameState();

  try {
    const parsed = JSON.parse(saved) as Partial<GameState>;

    if (!parsed.workerStamina) parsed.workerStamina = { level: 1 };
    if (!parsed.workerCycle) {
      parsed.workerCycle = { isResting: false, phaseStartTime: Date.now() };
    }
    if (!parsed.furnace) {
      parsed.furnace = {
        level: 1,
        maxLevel: FURNACE_CONFIG.maxLevel,
        currentOre: null,
        smeltStartTime: null,
        smeltDuration: FURNACE_CONFIG.baseSmeltDuration,
      };
    }
    if (!parsed.smoltenOres) {
      parsed.smoltenOres = createDefaultGameState().smoltenOres;
    }

    parsed.workers =
      parsed.workers?.map((worker) => ({
        ...worker,
        lastMineTime: worker.lastMineTime ?? 0,
      })) ?? [];

    const defaults = createDefaultGameState();

    return {
      ...defaults,
      ...parsed,
      ores: {
        ...defaults.ores,
        ...parsed.ores,
      },
      smoltenOres: {
        ...defaults.smoltenOres,
        ...parsed.smoltenOres,
      },
    };
  } catch (error) {
    console.warn("Failed to parse saved gameState:", error);
    return createDefaultGameState();
  }
};

export function applyStaminaBoost(
  setGame: Dispatch<SetStateAction<GameState>>
) {
  setGame((prev) => {
    if (prev.player.lightning > 0 && prev.workerCycle?.isResting) {
      return {
        ...prev,
        player: {
          ...prev.player,
          lightning: prev.player.lightning - 1,
        },
        workerCycle: {
          isResting: false,
          phaseStartTime: Date.now(),
        },
      };
    }
    return prev;
  });
}
