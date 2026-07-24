import { NextRequest, NextResponse } from "next/server";
import { makeMove, getGame } from "@/app/lib/gameStore";
import { prisma } from "@/app/lib/prisma";
import { deleteGame } from "@/app/lib/gameStore";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: gameId } = await params;
    const body = await request.json();

    if (body.column === undefined || !body.playerToken) {
      return NextResponse.json(
        { error: "Missing column or playerToken" },
        { status: 400 },
      );
    }

    const existing = await getGame(gameId);
    if (!existing) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const playerNumber =
      existing.players[1] === body.playerToken
        ? 1
        : existing.players[2] === body.playerToken
          ? 2
          : null;

    if (playerNumber === null) {
      return NextResponse.json(
        { error: "Invalid player token" },
        { status: 403 },
      );
    }

    if (existing.state !== "ongoing") {
      return NextResponse.json(
        { error: "Game is not ongoing" },
        { status: 400 },
      );
    }

    if (existing.currentPlayer !== playerNumber) {
      return NextResponse.json({ error: "Not your turn" }, { status: 403 });
    }

    const status = await makeMove(gameId, body.column, body.playerToken);
    if (!status) {
      return NextResponse.json({ error: "Invalid move" }, { status: 400 });
    }

    if (status.state === "won" || status.state === "draw") {
      if (process.env.DATABASE_URL) {
        const winner = status.winner;
        const loser = winner === 1 ? 2 : winner === 2 ? 1 : undefined;

        await prisma.game.create({
          data: {
            outcome: status.state === "won" ? "win" : "draw",
            winner: winner ?? null,
            loser: loser ?? null,
          },
        });
      }

      await deleteGame(gameId);
    }

    return NextResponse.json({ status }, { status: 200 });
  } catch (error) {
    console.error("Error making move:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to make move: ${message}` },
      { status: 500 },
    );
  }
}
