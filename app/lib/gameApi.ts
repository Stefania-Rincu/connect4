import {
  GameSubmission,
  CreateGameResponse,
  JoinGameResponse,
  MultiplayerGameStatus,
  OpenGame,
} from "./database.types";

async function fetchJson<T>(
  url: string,
  options?: RequestInit,
  errorMsg: string = "Request failed",
): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const data = await res.json().catch((err) => {
      console.error("Failed to parse error response as JSON:", err);
      return {} as { error?: string };
    });
    throw new Error(data.error || `${errorMsg}: ${res.status}`);
  }
  return res.json();
}

export async function postGameResult(
  submission: GameSubmission,
): Promise<void> {
  await fetchJson(
    "/api/games",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "result", ...submission }),
    },
    "Server error",
  );
  console.log("Game result uploaded successfully");
}

export async function createGameApi(): Promise<CreateGameResponse> {
  return fetchJson<CreateGameResponse>(
    "/api/games",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create" }),
    },
    "Failed to create game",
  );
}

export async function joinGameApi(gameId: string): Promise<JoinGameResponse> {
  return fetchJson<JoinGameResponse>(
    `/api/games/${gameId}/join`,
    {
      method: "POST",
    },
    "Failed to join game",
  );
}

export async function makeMoveApi(
  gameId: string,
  column: number,
  playerToken: string,
): Promise<MultiplayerGameStatus> {
  const data = await fetchJson<{ status: MultiplayerGameStatus }>(
    `/api/games/${gameId}/move`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ column, playerToken }),
    },
    "Failed to make move",
  );
  return data.status;
}

export async function getOpenGamesApi(): Promise<OpenGame[]> {
  const data = await fetchJson<{ games: OpenGame[] }>(
    "/api/games",
    undefined,
    "Failed to list games",
  );
  return data.games;
}

export function subscribeToGameWS(
  gameId: string,
  onUpdate: (status: MultiplayerGameStatus) => void,
): () => void {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws?gameId=${gameId}`;
  console.log("[WS] Connecting to", wsUrl);
  const ws = new WebSocket(wsUrl);
  let closed = false;

  ws.onopen = () => {
    console.log("[WS] Connected for game", gameId);
  };

  ws.onmessage = (event) => {
    try {
      const status = JSON.parse(event.data) as MultiplayerGameStatus;
      onUpdate(status);
    } catch (err) {
      console.error(
        "Failed to parse WebSocket message:",
        err,
        "raw:",
        event.data,
      );
    }
  };

  ws.onerror = (event) => {
    if (closed) return;
    console.error(
      "[WS] Error for game",
      gameId,
      "readyState:",
      ws.readyState,
      "event:",
      event,
    );
  };

  ws.onclose = (event) => {
    if (closed) return;
    console.log(
      "[WS] Closed for game",
      gameId,
      "code:",
      event.code,
      "reason:",
      event.reason,
    );
  };

  return () => {
    closed = true;
    ws.close();
  };
}
