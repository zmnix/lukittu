/*
  Warnings:

  - Added the required column `teamId` to the `Heartbeat` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Heartbeat" ADD COLUMN     "teamId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Heartbeat_teamId_idx" ON "Heartbeat"("teamId");

-- AddForeignKey
ALTER TABLE "Heartbeat" ADD CONSTRAINT "Heartbeat_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
