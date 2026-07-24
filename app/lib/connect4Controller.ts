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
    return this.getStatus();
  }

  public makeMove(column: number): GameStatus | null {
    if (this.gameState !== "ongoing") {
      return null;
    }

    if (column < 0 || column >= this.width) {
      return null;
    }

    let emptyRow = -1;
    for (let row = this.height - 1; row >= 0; row--) {
      if (this.board[row][column] === 0) {
        emptyRow = row;
        break;
      }
    }

    if (emptyRow === -1) {
      return null;
    }

    this.board[emptyRow][column] = this.currentPlayer;

    if (this.checkWin(emptyRow, column)) {
      this.gameState = "won";
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

  private checkWin(currentRow: number, currentColumn: number): boolean {
    const player = this.board[currentRow][currentColumn];
    if (player === 0) {
      return false;
    }

    const directions = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ];

    for (const [dirRow, dirCol] of directions) {
      let count = 1;

      for (const sign of [1, -1]) {
        let row = currentRow + dirRow * sign;
        let col = currentColumn + dirCol * sign;
        while (
          row >= 0 &&
          row < this.height &&
          col >= 0 &&
          col < this.width &&
          this.board[row][col] === player
        ) {
          count++;
          row += dirRow * sign;
          col += dirCol * sign;
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
      winner: this.gameState === "won" ? this.currentPlayer : undefined,
      currentPlayer: this.currentPlayer,
    };
  }
}
