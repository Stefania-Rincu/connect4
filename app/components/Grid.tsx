"use client";

import { useState } from "react";
import { Connect4Controller, GameStatus } from "../lib/connect4Controller";
import ResetButton from "./ResetButton";

type GridProps = {
  controller: Connect4Controller;
};

const PIECE_COLOURS = {
  0: "transparent",
  1: "rgb(239, 68, 68)",
  2: "rgb(234, 179, 8)",
};

export default function Grid({ controller }: GridProps) {
  const [gameStatus, setGameStatus] = useState<GameStatus>(() =>
    controller.newGame(),
  );

  const handleColumnClick = (column: number) => {
    if (gameStatus.state !== "ongoing") return;

    const newStatus = controller.makeMove(column);
    if (newStatus) {
      setGameStatus(newStatus);
    }
  };

  const handleReset = () => {
    setGameStatus(controller.newGame());
  };

  const getStatusMessage = () => {
    switch (gameStatus.state) {
      case "idle":
        return "Game not started";
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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${controller.width}, minmax(0, 1fr))`,
        }}
      >
        {gameStatus.board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              className="aspect-square w-10 h-10 border-1 border-gray-300 dark:border-gray-700 transition-colors"
              onClick={() => handleColumnClick(colIndex)}
            >
              <div
                className="w-full h-full rounded-full"
                style={{
                  backgroundColor: PIECE_COLOURS[cell],
                }}
              />
            </button>
          )),
        )}
      </div>
      <ResetButton onReset={handleReset} />
    </div>
  );
}
