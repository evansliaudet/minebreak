"use client";

import dynamic from "next/dynamic";

const GameComponent = dynamic(() => import("../components/GameComponent"), {
  ssr: false,
});

export default function GamePage() {
  return (
    <main className="w-screen h-screen bg-black flex items-center justify-center">
      <GameComponent />
    </main>
  );
}
