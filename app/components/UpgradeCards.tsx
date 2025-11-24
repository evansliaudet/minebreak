import Image from "next/image";
import { Dispatch, SetStateAction } from "react";
import { calculateUpgradeCost } from "@/utils/lib";

import { upgradeFurnace } from "../game/furnace/utils";
import { upgradeStorage } from "../game/storage/utils";
import { upgradeWorkerStamina } from "../game/worker/utils";
import { upgradePickaxe } from "../game/pickaxe/utils";

import { GameState } from "../game/utils";

interface UpgradeCardProps {
  game: GameState;
  setGame: Dispatch<SetStateAction<GameState>>;
}

export function PickaxeCard({ game, setGame }: UpgradeCardProps) {
  const cost = calculateUpgradeCost(game.pickaxe.level);
  return (
    <div className="border border-white p-3 mt-5">
      <div className="flex items-center gap-2">
        <p>Lvl.{game.pickaxe.level}</p>
        <Image src="/icons/pickaxe.png" alt="pickaxe" width={40} height={40} />
        <button
          onClick={() => upgradePickaxe(setGame)}
          disabled={cost > game.player.coins}
          className="bg-green-600 p-2 px-4 ml-2 cursor-pointer flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:enabled:bg-green-500 transition-colors"
        >
          Upgrade {cost}{" "}
          <Image src="/icons/coin.png" alt="coin" width={20} height={20} />
        </button>
      </div>
    </div>
  );
}

export function StaminaCard({ game, setGame }: UpgradeCardProps) {
  const cost = 5000 * Math.pow(2, game.workerStamina.level - 1);
  return (
    <div className="border border-white p-3 mt-5">
      <div className="flex flex-col gap-2">
        <p className="text-sm mb-1">
          Worker Stamina Lvl.{game.workerStamina.level}
        </p>
        <p className="text-xs opacity-80">
          Work: {game.workerStamina.level * 5}min | Rest: 15min
        </p>
        <button
          onClick={() => upgradeWorkerStamina(setGame)}
          disabled={game.player.coins < cost}
          className="bg-green-600 p-2 px-4 cursor-pointer flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:enabled:bg-green-500 transition-colors"
        >
          Upgrade {cost}{" "}
          <Image src="/icons/coin.png" alt="coin" width={20} height={20} />
        </button>
      </div>
    </div>
  );
}

export function StorageCard({ game, setGame }: UpgradeCardProps) {
  const cost = calculateUpgradeCost(game.storage.level);
  const isMax = game.storage.level === game.storage.maxLevel;
  return (
    <div className="border border-white p-3 mt-5">
      <div className="flex items-center gap-2">
        <p>Lvl.{isMax ? "Max" : game.storage.level}</p>
        <Image
          src="/icons/ore_storage.png"
          alt="storage"
          width={40}
          height={40}
        />
        <p>Storage</p>
        <button
          onClick={() => upgradeStorage({ game, setGame })}
          disabled={cost > game.player.coins || isMax}
          className="bg-green-600 p-2 px-4 ml-2 cursor-pointer flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:enabled:bg-green-500 transition-colors"
        >
          {isMax ? (
            "Maxed"
          ) : (
            <>
              Upgrade {cost}{" "}
              <Image src="/icons/coin.png" alt="coin" width={20} height={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function FurnaceCard({ game, setGame }: UpgradeCardProps) {
  const cost = calculateUpgradeCost(game.furnace.level) * 2;
  const isMax = game.furnace.level === game.furnace.maxLevel;
  return (
    <div className="border border-white p-3 mt-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <p>Lvl.{isMax ? "Max" : game.furnace.level}</p>
          <Image
            src="/icons/furnace.png"
            alt="furnace"
            width={40}
            height={40}
          />
          <p>Furnace</p>
          <button
            onClick={() => upgradeFurnace({ game, setGame })}
            disabled={cost > game.player.coins || isMax}
            className="bg-green-600 p-2 px-4 ml-2 cursor-pointer flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:enabled:bg-green-500 transition-colors"
          >
            {isMax ? (
              "Maxed"
            ) : (
              <>
                Upgrade {cost}{" "}
                <Image
                  src="/icons/coin.png"
                  alt="coin"
                  width={20}
                  height={20}
                />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
