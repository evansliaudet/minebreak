"use client";

import { useEffect, useRef, useState } from "react";
import type Phaser from "phaser";
import OreSprite from "@/types/OreSprite";
import OreType from "@/types/OreType";
import { GameState, OreKey, SmoltenOreKey, loadSavedGame } from "../game/utils";
import { getNextOreToSmelt } from "../game/furnace/utils";
import { updateWorkerStatus } from "../game/worker/utils";
import { getWeightedRandomOre, mineOresUnderPointer } from "../game/ores/utils";
import { processWorkers } from "../game/worker/utils";

import OreList from "./OreList";
import StatsPanel from "./StatsPanel";
import FurnaceTracker from "./FurnaceTracker";
import WorkerPanel from "./WorkerPanel";
import {
  PickaxeCard,
  StaminaCard,
  StorageCard,
  FurnaceCard,
} from "./UpgradeCards";

loadSavedGame();

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
  const [smeltProgress, setSmeltProgress] = useState(0);

  useEffect(() => {
    gameStateRef.current = game;
  }, [game]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("gameState", JSON.stringify(game));
  }, [game]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      setGame((prev) => {
        const furnace = prev.furnace;

        if (furnace.currentOre && furnace.smeltStartTime) {
          const elapsed = now - furnace.smeltStartTime;
          const progress = Math.min(elapsed / furnace.smeltDuration, 1);
          setSmeltProgress(progress);

          if (elapsed >= furnace.smeltDuration) {
            const smoltenKey = `smolten_${furnace.currentOre}` as SmoltenOreKey;

            return {
              ...prev,
              smoltenOres: {
                ...prev.smoltenOres,
                [smoltenKey]: {
                  ...prev.smoltenOres[smoltenKey],
                  count: prev.smoltenOres[smoltenKey].count + 1,
                },
              },
              furnace: {
                ...furnace,
                currentOre: null,
                smeltStartTime: null,
              },
            };
          }
          return prev;
        }

        const nextOre = getNextOreToSmelt(prev);
        if (nextOre) {
          setSmeltProgress(0);
          return {
            ...prev,
            ores: {
              ...prev.ores,
              [nextOre]: {
                ...prev.ores[nextOre],
                count: prev.ores[nextOre].count - 1,
              },
            },
            furnace: {
              ...furnace,
              currentOre: nextOre,
              smeltStartTime: now,
            },
          };
        }

        setSmeltProgress(0);
        return prev;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

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
              const oreType = getWeightedRandomOre(this);
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
            mineOresUnderPointer(
              this,
              pointer.worldX,
              pointer.worldY,
              gameStateRef,
              setGame
            );
          }

          const now = Date.now();
          const durations = this.getDurations(state);
          const { cycle, changed: cycleChanged } = this.advanceCycle(
            state,
            now,
            durations
          );
          updateWorkerStatus(setWorkerStatus, state, cycle, now, durations);

          const { workerSnapshots, oreGains, workersChanged } = processWorkers(
            state,
            cycle,
            now,
            this
          );

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

  return (
    <div className="relative w-full h-full flex items-center justify-center gap-10">
      <div id="phaser-container" className="w-[800px] h-[800px]" />
      <div className="text-white font-mono space-y-1 bg-black/70 p-4 w-[450px]">
        {/* Resources List */}
        <OreList game={game} setGame={setGame} />

        <div className="pt-10 space-y-5">
          {/* Stats */}
          <StatsPanel game={game} />

          {/* Active Furnace Progress */}
          <FurnaceTracker game={game} smeltProgress={smeltProgress} />

          {/* Scrollable Upgrades Area */}
          <div className="max-h-96 overflow-y-scroll pr-2">
            <PickaxeCard game={game} setGame={setGame} />
            <WorkerPanel
              game={game}
              setGame={setGame}
              workerStatus={workerStatus}
            />
            <StaminaCard game={game} setGame={setGame} />
            <StorageCard game={game} setGame={setGame} />
            <FurnaceCard game={game} setGame={setGame} />
          </div>
        </div>
      </div>
    </div>
  );
}
