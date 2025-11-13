"use client";

import { useEffect, useRef, useState } from "react";
import type Phaser from "phaser";
import Image from "next/image";
import OreSprite from "@/types/OreSprite";
import OreType from "@/types/OreType";
import { calculateUpgradeCost, calculateWorkerHireCost } from "@/utils/lib";
import {
  createDefaultGameState,
  GameState,
  Worker,
  OreKey,
  getTotalOreCount,
} from "../game/utils";

function OreIcon({ oreName, scale = 4 }: { oreName: string; scale?: number }) {
  return (
    /*eslint-disable*/
    <img
      src={`/icons/${oreName}.png`}
      width={16 * scale}
      height={16 * scale}
      alt={oreName}
    />
  );
}

const loadSavedGame = (): GameState => {
  if (typeof window === "undefined") return createDefaultGameState();

  const saved = localStorage.getItem("gameState");
  if (!saved) return createDefaultGameState();

  try {
    const parsed = JSON.parse(saved) as Partial<GameState>;

    if (!parsed.workerStamina) parsed.workerStamina = { level: 1 };
    if (!parsed.workerCycle) {
      parsed.workerCycle = { isResting: false, phaseStartTime: Date.now() };
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
    };
  } catch (error) {
    console.warn("Failed to parse saved gameState:", error);
    return createDefaultGameState();
  }
};

export default function GameComponent() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const mountedRef = useRef(false);
  const gameStateRef = useRef<GameState | null>(null);
  const [workerStatus, setWorkerStatus] = useState<{
    isWorking: boolean;
    timeRemaining: number;
  }>({
    isWorking: true,
    timeRemaining: 0,
  });

  const [game, setGame] = useState<GameState>(loadSavedGame);

  console.log(game);

  useEffect(() => {
    gameStateRef.current = game;
  }, [game]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("gameState", JSON.stringify(game));
  }, [game]);

  const upgradeWorkerStamina = () => {
    setGame((prev) => {
      const cost = 5000 * Math.pow(2, prev.workerStamina.level - 1);
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

  const upgradePickaxe = () => {
    setGame((prev) => {
      const cost = calculateUpgradeCost(prev.pickaxe.level);
      if (prev.player.coins < cost) return prev;

      const newLevel = prev.pickaxe.level + 1;
      const newSpeed = prev.pickaxe.speed / 1.2;

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

  const upgradeStorage = () => {
    setGame((prev) => {
      const cost = calculateUpgradeCost(prev.storage.level);
      if (prev.player.coins < cost) return prev;

      const newLevel = prev.storage.level + 1;
      const newStorageAmount = prev.storage.cap + 50;

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

  const hireWorker = () => {
    setGame((prev) => {
      if (prev.workers.length >= 5) return prev;
      const cost = calculateWorkerHireCost(game.workers.length);
      if (prev.player.coins < cost) return prev;

      const newWorker: Worker = {
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

  const sellOres = () => {
    setGame((prev) => {
      const totalCoins = Object.values(prev.ores).reduce(
        (sum, ore) => sum + ore.count * ore.price,
        0
      );

      const resetOres = Object.fromEntries(
        Object.entries(prev.ores).map(([k, ore]) => [k, { ...ore, count: 0 }])
      ) as GameState["ores"];

      return {
        ...prev,
        player: {
          ...prev.player,
          coins: prev.player.coins + totalCoins,
        },
        ores: resetOres,
      };
    });
  };

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const loadPhaser = async () => {
      const Phaser = (await import("phaser")).default;

      class MainScene extends Phaser.Scene {
        grid: OreSprite[][] = [];
        oreTypes: OreType[] = [
          { row: 0, name: "ore1", weight: 150, icon: "purple" },
          { row: 1, name: "ore2", weight: 120, icon: "green" },
          { row: 2, name: "ore3", weight: 80, icon: "black" },
          { row: 3, name: "ore4", weight: 50, icon: "red" },
          { row: 4, name: "ore5", weight: 15, icon: "diamond" },
          { row: 5, name: "ore6", weight: 5, icon: "red_shade" },
        ];
        gridSize = 12;
        oreStates = 6;
        pickaxe!: Phaser.GameObjects.Image;
        isMining = false;
        lastMineTime = 0;
        constructor() {
          super("MainScene");
        }

        preload() {
          this.load.spritesheet("ores", "/sprites/ores.png", {
            frameWidth: 16,
            frameHeight: 16,
          });
          this.load.image("pickaxe", "/icons/pickaxe.png");
        }

        create() {
          const { width, height } = this.scale;
          const tileSize = 64;
          const startX =
            width / 2 - (this.gridSize / 2) * tileSize + tileSize / 2;
          const startY =
            height / 2 - (this.gridSize / 2) * tileSize + tileSize / 2;

          for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
              const oreType = this.getWeightedRandomOre();
              const sprite = this.add
                .sprite(
                  startX + col * tileSize,
                  startY + row * tileSize,
                  "ores",
                  oreType.row * this.oreStates
                )
                .setScale(2)
                .setInteractive({
                  hitArea: new Phaser.Geom.Rectangle(-16, -16, 64, 64),
                  hitAreaCallback: Phaser.Geom.Rectangle.Contains,
                }) as OreSprite;
              sprite.state = 0;
              sprite.typeRow = oreType.row;
              this.grid[row][col] = sprite;
            }
          }

          this.pickaxe = this.add
            .image(0, 0, "pickaxe")
            .setVisible(false)
            .setScale(0.8)
            .setDepth(10);

          this.input.on("pointerdown", () => {
            this.isMining = true;
            this.pickaxe.setVisible(true);
          });

          this.input.on("pointerup", () => {
            this.isMining = false;
            this.pickaxe.setVisible(false);
          });

          if (this.input.mouse) {
            this.input.mouse.disableContextMenu();
            this.game.canvas.addEventListener("mouseleave", () => {
              this.isMining = false;
              this.pickaxe.setVisible(false);
            });
          }
        }

        getDurations(state: GameState) {
          const workDuration = state.workerStamina.level * 5 * 60 * 1000;
          const restDuration = 15 * 60 * 1000;
          return { workDuration, restDuration };
        }

        advanceCycle(
          state: GameState,
          now: number,
          durations: { workDuration: number; restDuration: number }
        ) {
          const cycle = state.workerCycle ?? {
            isResting: false,
            phaseStartTime: now,
          };
          const elapsed = now - cycle.phaseStartTime;
          let changed = false;

          if (!cycle.isResting && elapsed >= durations.workDuration) {
            cycle.isResting = true;
            cycle.phaseStartTime = now;
            changed = true;
          } else if (cycle.isResting && elapsed >= durations.restDuration) {
            cycle.isResting = false;
            cycle.phaseStartTime = now;
            changed = true;
          }

          return { cycle, changed };
        }

        updateWorkerStatus(
          state: GameState,
          cycle: GameState["workerCycle"],
          now: number,
          durations: { workDuration: number; restDuration: number }
        ) {
          if (state.workers.length === 0) return;

          const currentDuration = cycle.isResting
            ? durations.restDuration
            : durations.workDuration;
          const remaining = Math.max(
            0,
            currentDuration - (now - cycle.phaseStartTime)
          );

          setWorkerStatus({
            isWorking: !cycle.isResting,
            timeRemaining: remaining,
          });
        }

        processWorkers(
          state: GameState,
          cycle: GameState["workerCycle"],
          now: number
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
              if (now > worker.lastMineTime + state.pickaxe.speed * 2) {
                worker.lastMineTime = now;
                const oreType = this.getWeightedRandomOre(["ore1", "ore2"]);
                const oreKey = oreType.name as OreKey;

                oreGains[oreKey] = (oreGains[oreKey] ?? 0) + 1;
                workersChanged = true;
              }
            }
          }

          return { workerSnapshots, oreGains, workersChanged };
        }

        update(time: number) {
          const pointer = this.input.activePointer;
          const state = gameStateRef.current;
          if (!state) return;

          if (this.pickaxe.visible) {
            this.pickaxe.setPosition(pointer.worldX, pointer.worldY - 16);
            this.pickaxe.setRotation(Math.sin(time / 100) * 0.3);
          }

          if (this.isMining && time > this.lastMineTime + state.pickaxe.speed) {
            this.lastMineTime = time;
            this.mineOresUnderPointer(pointer.worldX, pointer.worldY);
          }

          const now = Date.now();
          const durations = this.getDurations(state);
          const { cycle, changed: cycleChanged } = this.advanceCycle(
            state,
            now,
            durations
          );
          this.updateWorkerStatus(state, cycle, now, durations);

          const { workerSnapshots, oreGains, workersChanged } =
            this.processWorkers(state, cycle, now);

          if (workersChanged || cycleChanged || Object.keys(oreGains).length) {
            const workerMap = new Map(workerSnapshots.map((w) => [w.id, w]));
            setGame((prev) => {
              const updatedWorkers = prev.workers.map((worker) => {
                const updated = workerMap.get(worker.id);
                return updated
                  ? {
                      ...worker,
                      lastMineTime: updated.lastMineTime,
                    }
                  : worker;
              });

              const oreKeys = Object.keys(oreGains) as OreKey[];

              const updatedOres =
                oreKeys.length === 0
                  ? prev.ores
                  : (Object.keys(prev.ores) as OreKey[]).reduce((acc, key) => {
                      const gain = oreGains[key] ?? 0;
                      acc[key] = gain
                        ? {
                            ...prev.ores[key],
                            count: prev.ores[key].count + gain,
                          }
                        : prev.ores[key];
                      return acc;
                    }, {} as GameState["ores"]);

              return {
                ...prev,
                workers: updatedWorkers,
                ores: updatedOres,
                workerCycle: cycleChanged
                  ? {
                      isResting: cycle.isResting,
                      phaseStartTime: cycle.phaseStartTime,
                    }
                  : prev.workerCycle,
              };
            });
          }
        }

        mineOresUnderPointer(x: number, y: number) {
          for (const row of this.grid) {
            for (const ore of row) {
              const dist = Phaser.Math.Distance.Between(x, y, ore.x, ore.y);
              if (dist < 32) {
                this.mineOre(ore);
                return;
              }
            }
          }
        }

        getWeightedRandomOre(allowed?: OreKey[]): OreType {
          const pool = allowed
            ? this.oreTypes.filter((o) => allowed.includes(o.name as OreKey))
            : this.oreTypes;

          const totalWeight = pool.reduce((sum, o) => sum + o.weight, 0);
          let random = Math.random() * totalWeight;

          for (const ore of pool) {
            random -= ore.weight;
            if (random <= 0) return ore;
          }

          return pool[pool.length - 1];
        }

        mineOre(ore: OreSprite) {
          const state = gameStateRef.current;
          if (!state) return;

          const totalOres = getTotalOreCount(state);
          if (totalOres >= state.storage.cap) {
            const txt = this.add
              .text(ore.x, ore.y - 40, "Storage Full!", {
                font: "16px Arial",
                color: "#ff4444",
              })
              .setDepth(100);

            this.time.addEvent({
              delay: 1000,
              callback: () => txt.destroy(),
            });
            return;
          }

          this.tweens.add({
            targets: ore,
            yoyo: true,
            duration: 60,
          });

          ore.state++;
          if (ore.state >= this.oreStates) {
            const oreType = this.oreTypes[ore.typeRow];
            const oreKey = oreType.name as OreKey;

            setGame((prev: GameState) => {
              // check again in React state to avoid async overflow
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

            const txt = this.add.text(ore.x, ore.y - 40, "+1", {
              font: "18px Arial",
              color: "#fff",
            });
            this.tweens.add({
              targets: txt,
              y: ore.y - 80,
              alpha: 0,
              duration: 500,
              onComplete: () => txt.destroy(),
            });

            const newOre = this.getWeightedRandomOre();
            ore.state = 0;
            ore.typeRow = newOre.row;
          }

          ore.setFrame(ore.typeRow * this.oreStates + ore.state);
        }
      }

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 800,
        parent: "phaser-container",
        backgroundColor: "#202020",
        scene: [MainScene],
      };

      gameRef.current = new Phaser.Game(config);
    };

    loadPhaser();

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center gap-10">
      <div id="phaser-container" className="w-[800px] h-[800px]" />
      <div className="text-white font-mono space-y-1 bg-black/70 p-4">
        <div>
          <div className="text-2xl font-bold mb-2">Ore Collection</div>
          {Object.entries(game.ores).map(([key, ore]) => (
            <div key={key} className="flex items-center gap-2">
              <OreIcon scale={2} oreName={ore.icon} />
              {key}: {ore.count}
            </div>
          ))}
          <button
            onClick={sellOres}
            className="bg-green-600 p-2 px-4 ml-2 cursor-pointer flex items-center gap-2 mt-4"
          >
            Sell all
          </button>
        </div>

        <div className="pt-10">
          <div className="flex items-center gap-2">
            Coins: {game.player.coins}{" "}
            <Image src="/icons/coin.png" alt="" width={20} height={20} />
          </div>

          <div className="flex items-center gap-2">
            Storage: {getTotalOreCount(game)}/{game.storage.cap}{" "}
            <Image src="/icons/ore_storage.png" alt="" width={20} height={20} />
          </div>

          <div className="max-h-96 overflow-y-scroll">
            <div className="border border-white p-3 mt-5">
              <div className="flex items-center gap-2">
                <p>Lvl.{game.pickaxe.level}</p>
                <Image src="/icons/pickaxe.png" alt="" width={40} height={40} />
                <button
                  onClick={upgradePickaxe}
                  disabled={
                    calculateUpgradeCost(game.pickaxe.level) > game.player.coins
                  }
                  className="bg-green-600 p-2 px-4 ml-2 cursor-pointer flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  Upgrade {calculateUpgradeCost(game.pickaxe.level)}{" "}
                  <Image src="/icons/coin.png" alt="" width={20} height={20} />
                </button>
              </div>
            </div>

            <div className="border border-white p-3 mt-5">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <p>Workers: {game.workers.length}/5</p>
                  <button
                    onClick={hireWorker}
                    disabled={
                      game.workers.length >= 5 ||
                      game.player.coins <
                        calculateWorkerHireCost(game.workers.length)
                    }
                    className="bg-green-600 p-2 px-4 ml-2 cursor-pointer flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    Hire {calculateWorkerHireCost(game.workers.length)}{" "}
                    <Image
                      src="/icons/coin.png"
                      alt=""
                      width={20}
                      height={20}
                    />
                  </button>
                </div>
                {game.workers.length > 0 && (
                  <div className="mt-2 text-sm">
                    <p
                      className={
                        workerStatus.isWorking
                          ? "text-green-400"
                          : "text-yellow-400"
                      }
                    >
                      {workerStatus.isWorking ? "⛏️ Working" : "💤 Resting"}
                    </p>
                    <p className="text-xs opacity-80">
                      {workerStatus.isWorking
                        ? "Work ends in: "
                        : "Rest ends in: "}
                      {formatTime(workerStatus.timeRemaining)}
                    </p>
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  {game.workers.map((worker) => (
                    <Image
                      key={worker.id}
                      src="/icons/pickaxe.png"
                      alt="worker"
                      width={30}
                      height={30}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="border border-white p-3 mt-5">
              <div className="flex flex-col gap-2">
                <p className="text-sm mb-1">
                  Worker Stamina Lvl.{game.workerStamina.level}
                </p>
                <p className="text-xs opacity-80">
                  Work: {game.workerStamina.level * 5}min | Rest: 15min
                </p>
                <button
                  onClick={upgradeWorkerStamina}
                  disabled={
                    game.player.coins <
                    5000 * Math.pow(2, game.workerStamina.level - 1)
                  }
                  className="bg-green-600 p-2 px-4 cursor-pointer flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  Upgrade {5000 * Math.pow(2, game.workerStamina.level - 1)}{" "}
                  <Image src="/icons/coin.png" alt="" width={20} height={20} />
                </button>
              </div>
            </div>

            <div className="border border-white p-3 mt-5">
              <div className="flex items-center gap-2">
                <p>Lvl.{game.storage.level}</p>
                <Image
                  src="/icons/ore_storage.png"
                  alt=""
                  width={40}
                  height={40}
                />
                <p>Storage</p>
                <button
                  onClick={upgradeStorage}
                  disabled={
                    calculateUpgradeCost(game.storage.level) > game.player.coins
                  }
                  className="bg-green-600 p-2 px-4 ml-2 cursor-pointer flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  Upgrade {calculateUpgradeCost(game.storage.level)}{" "}
                  <Image src="/icons/coin.png" alt="" width={20} height={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
