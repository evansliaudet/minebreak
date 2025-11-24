import { Dispatch, SetStateAction } from "react";
import { GameState } from "../game/utils"; // Adjust path to match your structure
import OreIcon from "./ui/OreIcon"; // Adjust path to match your structure
import { sellOres } from "../game/ores/utils"; // Adjust path

interface OreListProps {
  game: GameState;
  setGame: Dispatch<SetStateAction<GameState>>;
}

export default function OreList({ game, setGame }: OreListProps) {
  return (
    <div className="flex justify-between">
      <div>
        {Object.entries(game.ores).map(([key, ore]) => (
          <div key={key} className="flex items-center gap-2">
            <OreIcon scale={2} oreName={ore.icon} />
            {ore.icon}: {ore.count}
          </div>
        ))}
      </div>

      <div className="">
        {Object.entries(game.smoltenOres).map(([key, ore]) => (
          <div key={key} className="flex items-center gap-2">
            <OreIcon scale={2} oreName={ore.icon} />
            {ore.icon}: {ore.count}
          </div>
        ))}
        <button
          onClick={() => sellOres(setGame)}
          className="bg-green-600 p-2 px-4 ml-2 cursor-pointer flex items-center gap-2 mt-4 hover:bg-green-500 transition-colors"
        >
          Sell all smolten
        </button>
      </div>
    </div>
  );
}
