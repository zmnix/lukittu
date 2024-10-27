/*
  Warnings:

  - You are about to drop the column `fileChecksum` on the `Release` table. All the data in the column will be lost.
  - You are about to drop the column `fileKey` on the `Release` table. All the data in the column will be lost.
  - You are about to drop the column `fileName` on the `Release` table. All the data in the column will be lost.
  - You are about to drop the column `fileSize` on the `Release` table. All the data in the column will be lost.
  - You are about to drop the column `releaseStatus` on the `Release` table. All the data in the column will be lost.
  - You are about to drop the column `releaseType` on the `Release` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Release" DROP COLUMN "fileChecksum",
DROP COLUMN "fileKey",
DROP COLUMN "fileName",
DROP COLUMN "fileSize",
DROP COLUMN "releaseStatus",
DROP COLUMN "releaseType",
ADD COLUMN     "status" "ReleaseStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "type" "ReleaseType" NOT NULL DEFAULT 'OTHER';

-- CreateTable
CREATE TABLE "ReleaseFile" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "mainClassName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReleaseFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReleaseFile_releaseId_key" ON "ReleaseFile"("releaseId");

-- AddForeignKey
ALTER TABLE "ReleaseFile" ADD CONSTRAINT "ReleaseFile_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE;
