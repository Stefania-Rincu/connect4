"use client";

import { useState, useEffect } from "react";
import { MultiplayerGameStatus, Player } from "../lib/database.types";
import { makeMoveApi, subscribeToGameWS } from "../lib/gameApi";
import ResetButton from "./ResetButton";

type GridProps = {
  gameId: string;
  playerToken: string;
  playerNumber: Player;
  initialStatus: MultiplayerGameStatus;
  onExit: () => void;
};

const PIECE_COLOURS = {
  0: "transparent",
  1: "rgb(239, 68, 68)",
  2: "rgb(234, 179, 8)",
};

export default function Grid({
  gameId,
  playerToken,
  playerNumber,
  initialStatus,
  onExit,
}: GridProps) {
  const [gameStatus, setGameStatus] =
    useState<MultiplayerGameStatus>(initialStatus);
  const [moveError, setMoveError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToGameWS(gameId, (status) => {
      setGameStatus(status);
      setMoveError(null);
    });
    return unsubscribe;
  }, [gameId]);

  const isMyTurn =
    gameStatus.state === "ongoing" && gameStatus.currentPlayer === playerNumber;

  const handleColumnClick = (column: number) => {
    if (gameStatus.state !== "ongoing") return;
    if (gameStatus.currentPlayer !== playerNumber) return;

    makeMoveApi(gameId, column, playerToken).catch((error) => {
      console.error("Failed to make move:", error);
      setMoveError(
        error instanceof Error ? error.message : "Failed to make move",
      );
    });
  };

  const getStatusMessage = () => {
    switch (gameStatus.state) {
      case "waiting":
        return "Waiting for opponent to join...";
      case "ongoing":
        return `Player ${gameStatus.currentPlayer}'s turn`;
      case "won":
        return `Player ${gameStatus.winner} wins!`;
      case "draw":
        return "Draw!";
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-lg font-semibold">{getStatusMessage()}</div>
      {moveError && <p className="text-red-500 text-sm">{moveError}</p>}
      <div className="grid grid-cols-7">
        {gameStatus.board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              className="aspect-square w-10 h-10 border-1 border-gray-300 dark:border-gray-700 transition-colors"
              disabled={!isMyTurn}
              onClick={() => handleColumnClick(colIndex)}
            >
              <div
                className="w-full h-full rounded-full"
                style={{
                  backgroundColor: PIECE_COLOURS[cell as 0 | 1 | 2],
                }}
              />
            </button>
          )),
        )}
      </div>
      <ResetButton onReset={onExit} />
    </div>
  );
}
