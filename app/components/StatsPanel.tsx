import Image from "next/image";
import { GameState } from "../game/utils";
import { getTotalOreCount } from "@/utils/lib";

interface StatsPanelProps {
  game: GameState;
}

export default function StatsPanel({ game }: StatsPanelProps) {
  return (
    <div className="flex gap-6">
      <div className="flex items-center gap-2">
        Coins: {game.player.coins}{" "}
        <Image src="/icons/coin.png" alt="coin" width={20} height={20} />
      </div>

      <div className="flex items-center gap-2">
        Storage: {getTotalOreCount(game)}/{game.storage.cap}{" "}
        <Image
          src="/icons/ore_storage.png"
          alt="storage"
          width={20}
          height={20}
        />
      </div>
    </div>
  );
}
