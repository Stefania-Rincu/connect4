import { NextRequest } from "next/server";
import { getGame, subscribeToGame } from "@/app/lib/gameStore";
import { MultiplayerGameStatus } from "@/app/lib/database.types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: gameId } = await params;

  const existing = await getGame(gameId);
  if (!existing) {
    return new Response("Game not found", { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = (status: MultiplayerGameStatus) => {
        const data = `data: ${JSON.stringify(status)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      sendUpdate(existing);

      const unsubscribe = await subscribeToGame(gameId, sendUpdate);

      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch (err) {
          console.warn("Keepalive failed, stream may be closed:", err);
          clearInterval(keepAlive);
        }
      }, 15000);

      _request.signal.addEventListener("abort", async () => {
        clearInterval(keepAlive);
        await unsubscribe();
        try {
          controller.close();
        } catch (err) {
          console.debug("Stream already closed:", err);
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
