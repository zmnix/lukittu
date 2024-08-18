/*
  Warnings:

  - You are about to drop the column `expirationDate` on the `License` table. All the data in the column will be lost.
  - You are about to drop the column `licenseKeyLookup` on the `License` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "License_licenseKeyLookup_key";

-- AlterTable
ALTER TABLE "License" DROP COLUMN "expirationDate",
DROP COLUMN "licenseKeyLookup",
ADD COLUMN     "expiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "License_teamId_idx" ON "License"("teamId");
