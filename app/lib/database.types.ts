export type Outcome = "win" | "draw";

export interface GameSubmission {
  outcome: Outcome;
  winner?: number;
  loser?: number;
}
