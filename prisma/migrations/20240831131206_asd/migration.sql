/*
  Warnings:

  - A unique constraint covering the columns `[teamId,licenseKeyLookup]` on the table `License` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `licenseKeyLookup` to the `License` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "License_teamId_licenseKey_idx";

-- AlterTable
ALTER TABLE "License" ADD COLUMN     "licenseKeyLookup" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "License_teamId_licenseKeyLookup_key" ON "License"("teamId", "licenseKeyLookup");
