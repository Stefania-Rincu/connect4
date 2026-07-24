import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { getGame, subscribeToGame } from "./gameStore";
import { MultiplayerGameStatus } from "./database.types";

let wss: WebSocketServer | null = null;

const gameConnections = new Map<string, Set<WebSocket>>();

export function initWebSocketServer(
  server: Server,
  getNextUpgradeHandler: () => (
    req: import("http").IncomingMessage,
    socket: import("net").Socket,
    head: Buffer,
  ) => void,
) {
  wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    console.log("[WS Server] Upgrade request for", url.pathname, url.search);
    if (url.pathname === "/ws") {
      wss!.handleUpgrade(req, socket as import("net").Socket, head, (ws) => {
        wss!.emit("connection", ws, req);
      });
    } else {
      const nextHandler = getNextUpgradeHandler();
      nextHandler(req, socket as import("net").Socket, head);
    }
  });

  wss.on("connection", async (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const gameId = url.searchParams.get("gameId");
    if (!gameId) {
      ws.close(4001, "Missing gameId");
      return;
    }

    const existing = await getGame(gameId);
    if (!existing) {
      ws.close(4004, "Game not found");
      return;
    }

    if (!gameConnections.has(gameId)) {
      gameConnections.set(gameId, new Set());
    }
    gameConnections.get(gameId)!.add(ws);

    ws.send(JSON.stringify(existing));

    const unsubscribe = await subscribeToGame(gameId, (status) => {
      broadcastToGame(gameId, status);
    });

    ws.on("close", () => {
      gameConnections.get(gameId)?.delete(ws);
      if (gameConnections.get(gameId)?.size === 0) {
        gameConnections.delete(gameId);
      }
      unsubscribe();
    });

    ws.on("error", (err) => {
      console.error("WebSocket error:", err);
      gameConnections.get(gameId)?.delete(ws);
      if (gameConnections.get(gameId)?.size === 0) {
        gameConnections.delete(gameId);
      }
      unsubscribe();
    });
  });
}

function broadcastToGame(gameId: string, status: MultiplayerGameStatus) {
  const connections = gameConnections.get(gameId);
  if (!connections) return;

  const data = JSON.stringify(status);
  for (const ws of connections) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}
