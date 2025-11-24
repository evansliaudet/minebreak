import Image from "next/image";
import { Dispatch, SetStateAction } from "react";
import { GameState } from "../game/utils";
import { hireWorker, calculateWorkerHireCost } from "../game/worker/utils";

interface WorkerPanelProps {
  game: GameState;
  setGame: Dispatch<SetStateAction<GameState>>;
  workerStatus: {
    isWorking: boolean;
    timeRemaining: number;
  };
}

export default function WorkerPanel({
  game,
  setGame,
  workerStatus,
}: WorkerPanelProps) {
  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="border border-white p-3 mt-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <p>Workers: {game.workers.length}/5</p>
          <button
            onClick={() => hireWorker({ game, setGame })}
            disabled={
              game.workers.length >= 5 ||
              game.player.coins < calculateWorkerHireCost(game.workers.length)
            }
            className="bg-green-600 p-2 px-4 ml-2 cursor-pointer flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:enabled:bg-green-500 transition-colors"
          >
            Hire {calculateWorkerHireCost(game.workers.length)}{" "}
            <Image src="/icons/coin.png" alt="coin" width={20} height={20} />
          </button>
        </div>
        {game.workers.length > 0 && (
          <div className="mt-2 text-sm">
            <p
              className={
                workerStatus.isWorking ? "text-green-400" : "text-yellow-400"
              }
            >
              {workerStatus.isWorking ? "⛏️ Working" : "💤 Resting"}
            </p>
            <p className="text-xs opacity-80">
              {workerStatus.isWorking ? "Work ends in: " : "Rest ends in: "}
              {formatTime(workerStatus.timeRemaining)}
            </p>
          </div>
        )}
        <div className="flex gap-2 mt-2 flex-wrap">
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
  );
}
