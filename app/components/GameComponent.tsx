"use client";

import { useEffect, useRef, useState } from "react";
import type Phaser from "phaser";
import Image from "next/image";
import OreSprite from "@/types/OreSprite";
import OreType from "@/types/OreType";
import { calculateUpgradeCost } from "@/utils/lib";

// Sidebar icon component
function OreIcon({ oreName, scale = 4 }: { oreName: string; scale?: number }) {
  return (
    <img
      src={`/icons/${oreName}.png`}
      width={16 * scale}
      height={16 * scale}
      alt={oreName}
    />
  );
}

type OreKey = "ore1" | "ore2" | "ore3" | "ore4" | "ore5" | "ore6";

interface Worker {
  id: number;
  lastMineTime: number;
}

interface GameState {
  player: { coins: number };
  pickaxe: { level: number; speed: number };
  workers: Worker[];
  ores: Record<
    OreKey,
    { row: number; count: number; icon: string; price: number }
  >;
}

export default function GameComponent() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const mountedRef = useRef(false);
  const gameStateRef = useRef<GameState | null>(null);

  const [game, setGame] = useState<GameState>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gameState");
      if (saved) {
        try {
          return JSON.parse(saved) as GameState;
        } catch (e) {
          console.warn("Failed to parse saved gameState:", e);
        }
      }
    }

    return {
      player: { coins: 0 },
      pickaxe: { level: 0, speed: 800 },
      ores: {
        ore1: { row: 0, count: 0, icon: "purple", price: 5 },
        ore2: { row: 1, count: 0, icon: "green", price: 10 },
        ore3: { row: 2, count: 0, icon: "black", price: 25 },
        ore4: { row: 3, count: 0, icon: "red", price: 50 },
        ore5: { row: 4, count: 0, icon: "diamond", price: 100 },
        ore6: { row: 5, count: 0, icon: "red_shade", price: 250 },
      },
      workers: [],
    };
  });

  console.log(game);

  // keep live state in ref for Phaser
  useEffect(() => {
    gameStateRef.current = game;
  }, [game]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("gameState", JSON.stringify(game));
  }, [game]);

  const upgradePickaxe = () => {
    setGame((prev) => {
      const cost = calculateUpgradeCost(prev.pickaxe.level);
      if (prev.player.coins < cost) return prev;

      const newLevel = prev.pickaxe.level + 1;
      const newSpeed = 800 / (newLevel + 1); // faster per level

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

  const hireWorker = () => {
    setGame((prev) => {
      if (prev.workers.length >= 5) return prev;
      const cost = 200 + 200 * game.workers.length;
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
        workerData: Record<number, { lastMine: number }> = {};

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

          if (!this.workerData) this.workerData = {};

          for (const worker of state.workers) {
            if (!this.workerData[worker.id])
              this.workerData[worker.id] = { lastMine: 0 };

            const w = this.workerData[worker.id];

            if (time > w.lastMine + state.pickaxe.speed * 2) {
              // 2x slower than player
              w.lastMine = time;

              const oreType = this.getWeightedRandomOre(["ore1", "ore2"]);
              const oreKey = oreType.name as OreKey;

              // update React state for ores only
              setGame((prev) => ({
                ...prev,
                ores: {
                  ...prev.ores,
                  [oreKey]: {
                    ...prev.ores[oreKey],
                    count: prev.ores[oreKey].count + 1,
                  },
                },
              }));
            }
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
          this.tweens.add({
            targets: ore,
            yoyo: true,
            duration: 60,
          });

          ore.state++;
          if (ore.state >= this.oreStates) {
            const oreType = this.oreTypes[ore.typeRow];
            const oreKey = oreType.name as OreKey;

            setGame((prev: GameState) => ({
              ...prev,
              ores: {
                ...prev.ores,
                [oreKey]: {
                  ...prev.ores[oreKey],
                  count: prev.ores[oreKey].count + 1,
                },
              },
            }));

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

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div id="phaser-container" className="w-[800px] h-[800px]" />
      <div className="absolute top-4 left-4 text-white font-mono space-y-1">
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
          <div className="border border-white p-3 mt-5">
            <div className="flex items-center gap-2">
              <p>Lvl.{game.pickaxe.level}</p>
              <Image src="/icons/pickaxe.png" alt="" width={20} height={20} />
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
                    game.player.coins < 200 + 200 * game.workers.length
                  }
                  className="bg-green-600 p-2 px-4 ml-2 cursor-pointer flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  Hire {200 + 200 * game.workers.length}{" "}
                  <Image src="/icons/coin.png" alt="" width={20} height={20} />
                </button>
              </div>
              <div className="flex gap-2 mt-2">
                {game.workers.map((worker) => (
                  <Image
                    key={worker.id}
                    src="/icons/pickaxe.png"
                    alt="worker"
                    width={24}
                    height={24}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
