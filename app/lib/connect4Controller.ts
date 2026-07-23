export type GameState = "ongoing" | "won" | "draw" | "idle";
export type Player = 0 | 1 | 2; // 0 = empty, 1 = player 1, 2 = player 2

export interface GameStatus {
  state: GameState;
  winner?: Player;
  currentPlayer: Player;
  board: Player[][];
}

export class Connect4Controller {
  public width: number;
  private height: number;
  private board: Player[][];
  private currentPlayer: Player = 1;
  private gameState: GameState = "idle";
  private winner: Player = 0;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.board = this.initializeBoard();
  }

  private initializeBoard(): Player[][] {
    return Array.from({ length: this.height }, () => Array(this.width).fill(0));
  }

  public newGame(): GameStatus {
    this.board = this.initializeBoard();
    this.currentPlayer = 1;
    this.gameState = "ongoing";
    this.winner = 0;
    return this.getStatus();
  }

  public makeMove(column: number): GameStatus | null {
    if (this.gameState !== "ongoing") {
      return null;
    }

    if (column < 0 || column >= this.width) {
      return null;
    }

    let empty_row = -1;
    for (let row = this.height - 1; row >= 0; row--) {
      if (this.board[row][column] === 0) {
        empty_row = row;
        break;
      }
    }

    if (empty_row === -1) {
      return null;
    }

    this.board[empty_row][column] = this.currentPlayer;

    if (this.checkWin(empty_row, column)) {
      this.gameState = "won";
      this.winner = this.currentPlayer;
      return this.getStatus();
    }

    if (this.isBoardFull()) {
      this.gameState = "draw";
      return this.getStatus();
    }

    if (this.currentPlayer === 1) {
      this.currentPlayer = 2;
    } else {
      this.currentPlayer = 1;
    }

    return this.getStatus();
  }

  private isBoardFull(): boolean {
    return this.board[0].every((cell) => cell !== 0);
  }

  private checkWin(current_row: number, current_column: number): boolean {
    const player = this.board[current_row][current_column];
    if (player === 0) {
      return false;
    }

    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

    for (const [dir_row, dir_col] of directions) {
      let count = 1;

      for (const sign of [1, -1]) {
        let row = current_row + dir_row * sign;
        let col = current_column + dir_col * sign;
        while (row >= 0 && row < this.height && col >= 0 && col < this.width && this.board[row][col] === player) {
          count++;
          row += dir_row * sign;
          col += dir_col * sign;
        }
      }

      if (count >= 4) {
        return true;
      }
    }

    return false;
  }

  public getStatus(): GameStatus {
    return {
      board: this.board,
      state: this.gameState,
      winner: this.gameState === "won" ? this.winner : undefined,
      currentPlayer: this.currentPlayer,
    };
  }
}
