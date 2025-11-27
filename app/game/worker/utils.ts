import { Dispatch, SetStateAction } from "react";
import { GameState, OreKey } from "../utils";
import WorkerType from "@/types/WorkerType";
import { getTotalOreCount } from "@/utils/lib";
import WorkerStatus from "@/types/WorkerStatus";
import { getWeightedRandomOre, MiningScene } from "../ores/utils";
import { WORKER_CONFIG } from "../config";

export const calculateWorkerHireCost = (workerNb: number) => {
  return (
    WORKER_CONFIG.baseHireCost + WORKER_CONFIG.hireCostMultiplier * workerNb
  );
};

export const upgradeWorkerStamina = (
  setGame: Dispatch<SetStateAction<GameState>>
) => {
  setGame((prev) => {
    const cost =
      WORKER_CONFIG.staminaBaseCost * Math.pow(2, prev.workerStamina.level - 1);
    if (prev.player.coins < cost) return prev;

    return {
      ...prev,
      workerStamina: {
        level: prev.workerStamina.level + 1,
      },
      player: {
        ...prev.player,
        coins: prev.player.coins - cost,
      },
    };
  });
};

export const hireWorker = ({
  game,
  setGame,
}: {
  game: GameState;
  setGame: Dispatch<SetStateAction<GameState>>;
}) => {
  setGame((prev) => {
    if (prev.workers.length >= WORKER_CONFIG.maxWorkers) return prev;
    const cost = calculateWorkerHireCost(game.workers.length);
    if (prev.player.coins < cost) return prev;

    const newWorker: WorkerType = {
      id: Date.now(),
      lastMineTime: 0,
    };

    return {
      ...prev,
      workers: [...prev.workers, newWorker],
      player: {
        ...prev.player,
        coins: prev.player.coins - cost,
      },
    };
  });
};

export function processWorkers(
  state: GameState,
  cycle: GameState["workerCycle"],
  now: number,
  scene: MiningScene
) {
  const workerSnapshots = state.workers.map((worker) => ({
    ...worker,
  }));
  const oreGains: Partial<Record<OreKey, number>> = {};
  let workersChanged = false;

  const totalOres = getTotalOreCount(state);
  if (totalOres >= state.storage.cap)
    return { workerSnapshots, oreGains, workersChanged };

  if (!cycle.isResting) {
    for (const worker of workerSnapshots) {
      if (
        now >
        worker.lastMineTime +
          state.pickaxe.speed * WORKER_CONFIG.pickaxeSpeedPenalty
      ) {
        worker.lastMineTime = now;
        const oreType = getWeightedRandomOre(scene, ["ore1", "ore2"]);
        const oreKey = oreType.name as OreKey;

        oreGains[oreKey] = (oreGains[oreKey] ?? 0) + 1;
        workersChanged = true;
      }
    }
  }

  return { workerSnapshots, oreGains, workersChanged };
}

export function updateWorkerStatus(
  setWorkerStatus: Dispatch<SetStateAction<WorkerStatus>>,
  state: GameState,
  cycle: GameState["workerCycle"],
  now: number,
  durations: { workDuration: number; restDuration: number }
) {
  if (state.workers.length === 0) return;

  const currentDuration = cycle.isResting
    ? durations.restDuration
    : durations.workDuration;
  const remaining = Math.max(0, currentDuration - (now - cycle.phaseStartTime));

  setWorkerStatus({
    isWorking: !cycle.isResting,
    timeRemaining: remaining,
  });
}
