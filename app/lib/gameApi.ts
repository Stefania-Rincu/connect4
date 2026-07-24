import { GameSubmission } from "./database.types";

export async function postGameResult(
  submission: GameSubmission,
): Promise<void> {
  const res = await fetch("/api/games", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(submission),
  });

  if (!res.ok) {
    throw new Error(`Server responded with ${res.status}`);
  }

  console.log("Game result uploaded successfully");
}
