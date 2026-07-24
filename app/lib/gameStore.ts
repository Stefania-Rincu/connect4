import { redisClient, ensureRedisConnected } from "./redis";
import { MultiplayerGameStatus, OpenGame } from "./database.types";
import { Connect4Controller } from "./connect4Controller";

const GAME_KEY_PREFIX = "game:";
const GAME_LIST_KEY = "games:open";
const GAME_CHANNEL_PREFIX = "game-channel:";
const GAME_TTL = 3600; // 1 hour in seconds

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function createInitialBoard(width: number, height: number): number[][] {
  return Array.from({ length: height }, () => Array(width).fill(0));
}

export async function createGame(): Promise<{
  gameId: string;
  playerToken: string;
  status: MultiplayerGameStatus;
}> {
  await ensureRedisConnected();

  const gameId = generateId();
  const playerToken = generateToken();
  const now = new Date().toISOString();

  const status: MultiplayerGameStatus = {
    gameId,
    board: createInitialBoard(7, 6),
    currentPlayer: 1,
    state: "waiting",
    playerCount: 1,
    players: {
      1: playerToken,
    },
  };

  await redisClient.set(`${GAME_KEY_PREFIX}${gameId}`, JSON.stringify(status), {
    EX: GAME_TTL,
  });

  await redisClient.sAdd(
    GAME_LIST_KEY,
    JSON.stringify({ gameId, playerCount: 1, createdAt: now }),
  );

  return { gameId, playerToken, status };
}

export async function joinGame(
  gameId: string,
): Promise<{ playerToken: string; status: MultiplayerGameStatus } | null> {
  await ensureRedisConnected();

  const raw = await redisClient.get(`${GAME_KEY_PREFIX}${gameId}`);
  if (!raw) return null;

  const status = JSON.parse(raw) as MultiplayerGameStatus;

  if (status.playerCount >= 2) {
    return null;
  }

  const playerToken = generateToken();
  status.players[2] = playerToken;
  status.playerCount = 2;
  status.state = "ongoing";

  await redisClient.set(`${GAME_KEY_PREFIX}${gameId}`, JSON.stringify(status), {
    EX: GAME_TTL,
  });

  await publishGameUpdate(gameId, status);

  const openGames = await redisClient.sMembers(GAME_LIST_KEY);
  for (const g of openGames) {
    const parsed = JSON.parse(g) as OpenGame;
    if (parsed.gameId === gameId) {
      await redisClient.sRem(GAME_LIST_KEY, g);
      break;
    }
  }

  return { playerToken, status };
}

export async function getGame(
  gameId: string,
): Promise<MultiplayerGameStatus | null> {
  await ensureRedisConnected();

  const raw = await redisClient.get(`${GAME_KEY_PREFIX}${gameId}`);
  if (!raw) return null;

  return JSON.parse(raw) as MultiplayerGameStatus;
}

export async function makeMove(
  gameId: string,
  column: number,
  playerToken: string,
): Promise<MultiplayerGameStatus | null> {
  await ensureRedisConnected();

  const raw = await redisClient.get(`${GAME_KEY_PREFIX}${gameId}`);
  if (!raw) return null;

  const status = JSON.parse(raw) as MultiplayerGameStatus;

  if (status.state !== "ongoing") {
    return null;
  }

  const playerNumber =
    status.players[1] === playerToken
      ? 1
      : status.players[2] === playerToken
        ? 2
        : null;
  if (playerNumber === null) {
    return null;
  }

  if (status.currentPlayer !== playerNumber) {
    return null;
  }

  const controller = new Connect4Controller(7, 6);
  controller.loadState(status.board, status.currentPlayer, status.state);

  const result = controller.makeMove(column);
  if (!result) {
    return null;
  }

  status.board = result.board;
  status.state = result.state;
  status.winner = result.winner;
  status.currentPlayer = result.currentPlayer;

  await redisClient.set(`${GAME_KEY_PREFIX}${gameId}`, JSON.stringify(status), {
    EX: GAME_TTL,
  });

  await publishGameUpdate(gameId, status);

  return status;
}

export async function getOpenGames(): Promise<OpenGame[]> {
  await ensureRedisConnected();

  const members = await redisClient.sMembers(GAME_LIST_KEY);
  return members
    .map((m) => JSON.parse(m) as OpenGame)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function publishGameUpdate(
  gameId: string,
  status: MultiplayerGameStatus,
): Promise<void> {
  await redisClient.publish(
    `${GAME_CHANNEL_PREFIX}${gameId}`,
    JSON.stringify(status),
  );
}

export async function subscribeToGame(
  gameId: string,
  callback: (status: MultiplayerGameStatus) => void,
): Promise<() => Promise<void>> {
  await ensureRedisConnected();

  const subscriber = redisClient.duplicate();
  await subscriber.connect();

  const channel = `${GAME_CHANNEL_PREFIX}${gameId}`;

  await subscriber.subscribe(channel, (message) => {
    const status = JSON.parse(message) as MultiplayerGameStatus;
    callback(status);
  });

  return async () => {
    await subscriber.unsubscribe(channel);
    await subscriber.quit();
  };
}

export async function deleteGame(gameId: string): Promise<void> {
  await ensureRedisConnected();
  await redisClient.del(`${GAME_KEY_PREFIX}${gameId}`);

  const openGames = await redisClient.sMembers(GAME_LIST_KEY);
  for (const g of openGames) {
    const parsed = JSON.parse(g) as OpenGame;
    if (parsed.gameId === gameId) {
      await redisClient.sRem(GAME_LIST_KEY, g);
      break;
    }
  }
}
