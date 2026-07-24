import { NextRequest, NextResponse } from "next/server";
import { createGame, getOpenGames } from "@/app/lib/gameStore";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const openGames = await getOpenGames();
    return NextResponse.json({ games: openGames });
  } catch (error) {
    console.error("Error listing games:", error);
    return NextResponse.json(
      { error: "Failed to list games" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === "create") {
      const { gameId, playerToken, status } = await createGame();

      return NextResponse.json(
        {
          gameId,
          playerToken,
          playerNumber: 1,
          status,
        },
        { status: 201 },
      );
    }

    if (action === "result") {
      if (
        !body.outcome ||
        (body.outcome !== "win" && body.outcome !== "draw")
      ) {
        return NextResponse.json(
          { error: "Missing or invalid outcome field" },
          { status: 400 },
        );
      }

      if (
        body.outcome === "win" &&
        (body.winner === undefined || body.loser === undefined)
      ) {
        return NextResponse.json(
          { error: "Winner and loser required for a win" },
          { status: 400 },
        );
      }

      if (!process.env.DATABASE_URL) {
        return NextResponse.json(
          { error: "Database not configured" },
          { status: 500 },
        );
      }

      const game = await prisma.game.create({
        data: {
          outcome: body.outcome,
          winner: body.winner ?? null,
          loser: body.loser ?? null,
        },
      });

      return NextResponse.json({ id: game.id, success: true }, { status: 201 });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'create' or 'result'." },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error in games route:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed: ${message}` }, { status: 500 });
  }
}
