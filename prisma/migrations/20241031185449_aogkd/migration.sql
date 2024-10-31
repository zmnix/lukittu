/*
  Warnings:

  - You are about to drop the column `type` on the `Release` table. All the data in the column will be lost.
  - You are about to drop the column `latest` on the `ReleaseFile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Release" DROP COLUMN "type",
ADD COLUMN     "latest" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ReleaseFile" DROP COLUMN "latest";

-- DropEnum
DROP TYPE "ReleaseType";
