-- CreateEnum
CREATE TYPE "Outcome" AS ENUM ('win', 'draw');

-- CreateTable
CREATE TABLE "games" (
    "id" SERIAL NOT NULL,
    "outcome" "Outcome" NOT NULL,
    "winner" INTEGER,
    "loser" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "games_created_at_idx" ON "games"("created_at");
