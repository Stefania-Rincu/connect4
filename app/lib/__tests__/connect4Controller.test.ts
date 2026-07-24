import { Connect4Controller } from "../connect4Controller";

describe("Connect4Controller", () => {
  describe("makeMove", () => {
    it("should fill a 1x1 grid when making a move in column 0", () => {
      const controller = new Connect4Controller(1, 1);
      controller.newGame();

      const status = controller.makeMove(0);

      expect(status).not.toBeNull();
      expect(status?.board[0][0]).toBe(1);
    });

    it("should place the counter on the lowest empty row", () => {
      const controller = new Connect4Controller(7, 6);
      controller.newGame();

      const status = controller.makeMove(3);

      expect(status?.board[5][3]).toBe(1);
      expect(status?.board[4][3]).toBe(0);
    });

    it("should stack counters on top of each other on the same column", () => {
      const controller = new Connect4Controller(7, 6);
      controller.newGame();

      controller.makeMove(3);
      const status = controller.makeMove(3);

      expect(status?.board[5][3]).toBe(1);
      expect(status?.board[4][3]).toBe(2);
      expect(status?.board[3][3]).toBe(0);
    });

    it("should switch the current player after a move", () => {
      const controller = new Connect4Controller(7, 6);
      controller.newGame();

      const status = controller.makeMove(0);
      expect(status?.currentPlayer).toBe(2);

      const nextStatus = controller.makeMove(0);
      expect(nextStatus?.currentPlayer).toBe(1);

      const nextNextStatus = controller.makeMove(0);
      expect(nextNextStatus?.currentPlayer).toBe(2);
    });

    it("should return null for a column outside the grid", () => {
      const controller = new Connect4Controller(7, 6);
      controller.newGame();

      expect(controller.makeMove(-1)).toBeNull();
      expect(controller.makeMove(7)).toBeNull();
    });

    it("should return null when the column is full", () => {
      const controller = new Connect4Controller(7, 6);
      controller.newGame();

      for (let i = 0; i < 6; i++) {
        expect(controller.makeMove(0)).not.toBeNull();
      }

      expect(controller.makeMove(0)).toBeNull();
    });

    it("should not switch player after an invalid move", () => {
      const controller = new Connect4Controller(7, 6);
      controller.newGame();

      controller.makeMove(-1);
      const status = controller.makeMove(0);

      expect(status?.board[5][0]).toBe(1);
      expect(status?.currentPlayer).toBe(2);
    });
  });

  describe("win and draw condition", () => {
    it("should detect a horizontal win", () => {
      const controller = new Connect4Controller(7, 6);
      controller.newGame();

      controller.makeMove(0);
      controller.makeMove(0);
      controller.makeMove(1);
      controller.makeMove(1);
      controller.makeMove(2);
      controller.makeMove(2);
      const status = controller.makeMove(3);

      expect(status?.state).toBe("won");
      expect(status?.winner).toBe(1);
    });

    it("should detect a vertical win", () => {
      const controller = new Connect4Controller(7, 6);
      controller.newGame();

      controller.makeMove(0);
      controller.makeMove(1);
      controller.makeMove(0);
      controller.makeMove(1);
      controller.makeMove(0);
      controller.makeMove(1);
      const status = controller.makeMove(0);

      expect(status?.state).toBe("won");
      expect(status?.winner).toBe(1);
    });

    it("should detect a diagonal win (down-right)", () => {
      const controller = new Connect4Controller(7, 6);
      controller.newGame();

      controller.makeMove(0);
      controller.makeMove(1);
      controller.makeMove(1);
      controller.makeMove(2);
      controller.makeMove(2);
      controller.makeMove(3);
      controller.makeMove(2);
      controller.makeMove(3);
      controller.makeMove(3);
      controller.makeMove(0);
      const status = controller.makeMove(3);

      expect(status?.state).toBe("won");
      expect(status?.winner).toBe(1);
    });

    it("should not switch the players once the game ended with one player winning", () => {
      const controller = new Connect4Controller(7, 6);
      controller.newGame();

      controller.makeMove(0);
      controller.makeMove(1);
      controller.makeMove(0);
      controller.makeMove(1);
      controller.makeMove(0);
      controller.makeMove(1);
      const status = controller.makeMove(0);

      expect(status?.currentPlayer).toBe(1);
      expect(controller.makeMove(2)).toBeNull();
    });

    it("should detect a draw when the board fills", () => {
      const controller = new Connect4Controller(2, 2);
      controller.newGame();

      controller.makeMove(0);
      controller.makeMove(0);
      controller.makeMove(1);
      const status = controller.makeMove(1);

      expect(status?.state).toBe("draw");
      expect(status?.winner).toBeUndefined();
    });

    it("should not switch the players once the game ended with draw", () => {
      const controller = new Connect4Controller(2, 2);
      controller.newGame();

      controller.makeMove(0);
      controller.makeMove(0);
      controller.makeMove(1);
      const status = controller.makeMove(1);

      expect(status?.currentPlayer).toBe(2);
      expect(controller.makeMove(2)).toBeNull();
    });
  });
});
