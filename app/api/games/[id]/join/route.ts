import { NextRequest, NextResponse } from "next/server";
import { joinGame, getGame } from "@/app/lib/gameStore";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: gameId } = await params;

    const existing = await getGame(gameId);
    if (!existing) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const result = await joinGame(gameId);
    if (!result) {
      return NextResponse.json(
        { error: "Game is already full" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        gameId,
        playerToken: result.playerToken,
        playerNumber: 2,
        status: result.status,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error joining game:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to join game: ${message}` },
      { status: 500 },
    );
  }
}
