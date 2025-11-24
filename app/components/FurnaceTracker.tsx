import OreIcon from "./ui/OreIcon";
import { GameState } from "../game/utils";

interface FurnaceTrackerProps {
  game: GameState;
  smeltProgress: number;
}

export default function FurnaceTracker({
  game,
  smeltProgress,
}: FurnaceTrackerProps) {
  return (
    <div className="mt-2 p-2 bg-gray-800 rounded">
      {game.furnace.currentOre ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs">Smelting:</span>
            <OreIcon
              scale={1.5}
              oreName={game.ores[game.furnace.currentOre].icon}
            />
            <span className="text-xs">{game.furnace.currentOre}</span>
          </div>
          <div className="w-full bg-gray-700 h-4 rounded overflow-hidden">
            <div
              className="bg-green-500 h-full transition-all duration-100 ease-linear"
              style={{ width: `${smeltProgress * 100}%` }}
            />
          </div>
          <p className="text-xs opacity-80">
            {(
              ((1 - smeltProgress) * game.furnace.smeltDuration) /
              1000
            ).toFixed(1)}
            s remaining
          </p>
        </div>
      ) : (
        <p className="text-xs opacity-60">🔥 Idle - Waiting for ore</p>
      )}
    </div>
  );
}
