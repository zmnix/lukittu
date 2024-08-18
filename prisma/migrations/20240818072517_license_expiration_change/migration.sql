/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `License` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "LicenseExpirationType" AS ENUM ('NEVER', 'DATE', 'DURATION');

-- CreateEnum
CREATE TYPE "LicenseExpirationStart" AS ENUM ('ACTIVATION', 'CREATION');

-- AlterTable
ALTER TABLE "License" DROP COLUMN "expiresAt",
ADD COLUMN     "expirationDate" TIMESTAMP(3),
ADD COLUMN     "expirationDays" INTEGER,
ADD COLUMN     "expirationStart" "LicenseExpirationStart" NOT NULL DEFAULT 'CREATION',
ADD COLUMN     "expirationType" "LicenseExpirationType" NOT NULL DEFAULT 'NEVER';
