"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Grid from "./components/Grid";
import { createGameApi, joinGameApi, getOpenGamesApi } from "./lib/gameApi";
import { MultiplayerGameStatus, OpenGame, Player } from "./lib/database.types";

interface GameSession {
  gameId: string;
  playerToken: string;
  playerNumber: Player;
  status: MultiplayerGameStatus;
}

export default function Home() {
  const [session, setSession] = useState<GameSession | null>(null);
  const [openGames, setOpenGames] = useState<OpenGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) return;

    let cancelled = false;
    const doRefresh = async (isInitial: boolean) => {
      try {
        const games = await getOpenGamesApi();
        if (!cancelled) {
          setOpenGames(games);
          if (isInitial) setError(null);
        }
      } catch (err) {
        if (isInitial && !cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load open games",
          );
        }
      }
    };

    doRefresh(true);
    const interval = setInterval(() => doRefresh(false), 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [session]);

  const startGame = async (
    action: () => Promise<{
      gameId: string;
      playerToken: string;
      playerNumber: Player;
      status: MultiplayerGameStatus;
    }>,
    errorMsg: string,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await action();
      setSession(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleExit = () => {
    setSession(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center gap-12 py-32 px-16 bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Connect 4
          </h1>
          {session ? (
            <p className="text-sm text-zinc-500">
              Game ID: {session.gameId} | You are Player {session.playerNumber}
            </p>
          ) : (
            <>
              <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
                Online multiplayer
              </p>
              <Link
                href="/stats"
                className="text-blue-500 hover:text-blue-600 text-sm"
              >
                View Statistics →
              </Link>
            </>
          )}
        </div>

        {session ? (
          <Grid
            gameId={session.gameId}
            playerToken={session.playerToken}
            playerNumber={session.playerNumber}
            initialStatus={session.status}
            onExit={handleExit}
          />
        ) : (
          <>
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              onClick={() => startGame(createGameApi, "Failed to create game")}
              disabled={loading}
              className="px-6 py-3 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create New Game"}
            </button>

            {openGames.length > 0 && (
              <div className="flex flex-col items-center gap-4 w-full max-w-md">
                <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
                  Open Games
                </h2>
                <div className="flex flex-col gap-2 w-full">
                  {openGames.map((game) => (
                    <button
                      key={game.gameId}
                      onClick={() =>
                        startGame(
                          () => joinGameApi(game.gameId),
                          "Failed to join game",
                        )
                      }
                      disabled={loading}
                      className="px-4 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50"
                    >
                      Join Game {game.gameId}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
