import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col gap-5 justify-center items-center h-screen back-img">
      <h1 className="text-5xl font-bold">Minebreak</h1>
      <p className="text-xl">Dig, mine, and break your way to victory!</p>
      <Link href="/game">
        <button className="px-8 py-4 text-2xl font-bold bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg">
          ▶ PLAY
        </button>
      </Link>
    </main>
  );
}
