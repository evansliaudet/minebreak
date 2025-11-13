export type OreKey = "ore1" | "ore2" | "ore3" | "ore4" | "ore5" | "ore6";

export interface Worker {
  id: number;
  lastMineTime: number;
}

export interface GameState {
  player: { coins: number };
  pickaxe: { level: number; speed: number };
  storage: { cap: number; level: number };
  workerStamina: { level: number };
  workerCycle: { isResting: boolean; phaseStartTime: number };
  workers: Worker[];
  ores: Record<
    OreKey,
    { row: number; count: number; icon: string; price: number }
  >;
}

export const createDefaultGameState = (): GameState => ({
  player: { coins: 0 },
  pickaxe: { level: 0, speed: 800 },
  storage: { cap: 50, level: 1 },
  workerStamina: { level: 1 },
  workerCycle: { isResting: false, phaseStartTime: Date.now() },
  ores: {
    ore1: { row: 0, count: 0, icon: "purple", price: 5 },
    ore2: { row: 1, count: 0, icon: "green", price: 10 },
    ore3: { row: 2, count: 0, icon: "black", price: 25 },
    ore4: { row: 3, count: 0, icon: "red", price: 50 },
    ore5: { row: 4, count: 0, icon: "diamond", price: 100 },
    ore6: { row: 5, count: 0, icon: "red_shade", price: 250 },
  },
  workers: [],
});

export const getTotalOreCount = (game: GameState) => {
  return Object.values(game.ores).reduce((sum, ore) => sum + ore.count, 0);
};
