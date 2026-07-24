export type Outcome = "win" | "draw";

export type Player = 1 | 2;

export interface GameSubmission {
  outcome: Outcome;
  winner?: Player;
  loser?: Player;
}

export interface MultiplayerGameStatus {
  gameId: string;
  board: number[][];
  currentPlayer: Player;
  state: "ongoing" | "won" | "draw" | "waiting";
  winner?: Player;
  playerCount: number;
  players: {
    1?: string;
    2?: string;
  };
}

export interface CreateGameResponse {
  gameId: string;
  playerToken: string;
  playerNumber: Player;
  status: MultiplayerGameStatus;
}

export interface JoinGameResponse {
  gameId: string;
  playerToken: string;
  playerNumber: Player;
  status: MultiplayerGameStatus;
}

export interface OpenGame {
  gameId: string;
  playerCount: number;
  createdAt: string;
}
