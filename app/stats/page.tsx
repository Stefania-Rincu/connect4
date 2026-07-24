import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  let games: {
    id: number;
    outcome: string;
    winner: number | null;
    loser: number | null;
    createdAt: Date;
  }[] = [];
  let fetchError: string | null = null;

  try {
    if (process.env.DATABASE_URL) {
      games = await prisma.game.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    }
  } catch (error) {
    console.error("Error fetching games:", error);
    fetchError =
      error instanceof Error ? error.message : "Failed to load games";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center gap-12 py-32 px-16 bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Stats
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            {games.length} game{games.length !== 1 ? "s" : ""} played
          </p>
        </div>

        {fetchError ? (
          <p className="text-red-500 text-sm">{fetchError}</p>
        ) : games.length === 0 ? (
          <p className="text-zinc-500 text-sm">No games played yet.</p>
        ) : (
          <div className="w-full max-w-md flex flex-col gap-2">
            {games.map((game) => (
              <div
                key={game.id}
                className="flex items-center justify-between px-4 py-3 rounded-md border border-zinc-200 dark:border-zinc-800"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {game.outcome === "win"
                      ? `Player ${game.winner} wins`
                      : "Draw"}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {new Date(game.createdAt).toLocaleString()}
                  </span>
                </div>
                <span className="text-xs text-zinc-400">#{game.id}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
