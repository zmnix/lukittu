/*
  Warnings:

  - A unique constraint covering the columns `[teamId,type,value]` on the table `Blacklist` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Blacklist_teamId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Blacklist_teamId_type_value_key" ON "Blacklist"("teamId", "type", "value");
