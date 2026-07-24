import { NextRequest, NextResponse } from "next/server";
import { GameSubmission } from "@/app/lib/database.types";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body: GameSubmission = await request.json();

    if (!body.outcome || (body.outcome !== "win" && body.outcome !== "draw")) {
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
  } catch (error) {
    console.error("Error saving game:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to save game: ${message}` },
      { status: 500 },
    );
  }
}
