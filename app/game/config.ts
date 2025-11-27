import { OreKey } from "./utils";

export const MINING_CONFIG = {
  clickDistance: 32,
  mineTweenDuration: 60,
  uiTextDuration: 500,
  uiTextOffset: 40,
  uiFloatHeight: 80,
};

export const LIGHTNING_CONFIG = {
  spawnChance: 5,
};

export const STAMINA_CONFIG = {
  baseStaminaTime: 5,
  baseUpgradeCost: 2000,
  upgradePowerMultiplier: 2,
};

export const WORKER_CONFIG = {
  maxWorkers: 5,
  baseHireCost: 200,
  hireCostMultiplier: 900,
  staminaBaseCost: 5000,
  baseWorkMinutes: 5,
  baseRestMinutes: 15,
  pickaxeSpeedPenalty: 2,
};

export const FURNACE_CONFIG = {
  baseSmeltDuration: 2000,
  minSmeltDuration: 100,
  levelSpeedMultiplier: 0.8,
  upgradeCostMultiplier: 0.8,
  maxLevel: 10,
};

export const STORAGE_CONFIG = {
  baseCap: 50,
  capIncrement: 50,
  baseLevel: 1,
  maxLevel: 5,
};

export const PICKAXE_CONFIG = {
  baseSpeed: 800,
  speedDivisor: 1.2,
};

export const UPGRADE_CONFIG = {
  baseCost: 200,
  costMultiplier: 700,
};

export const ORE_ORDER: OreKey[] = [
  "ore6",
  "ore5",
  "ore4",
  "ore3",
  "ore2",
  "ore1",
];
