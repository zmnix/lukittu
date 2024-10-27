/*
  Warnings:

  - You are about to drop the `Releases` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Releases" DROP CONSTRAINT "Releases_createdByUserId_fkey";

-- DropForeignKey
ALTER TABLE "Releases" DROP CONSTRAINT "Releases_productId_fkey";

-- DropForeignKey
ALTER TABLE "Releases" DROP CONSTRAINT "Releases_teamId_fkey";

-- DropTable
DROP TABLE "Releases";

-- CreateTable
CREATE TABLE "Release" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "downloadUrl" TEXT,
    "fileSize" INTEGER,
    "releaseType" "ReleaseType" NOT NULL DEFAULT 'MINOR',
    "releaseStatus" "ReleaseStatus" NOT NULL DEFAULT 'DRAFT',
    "teamId" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" TEXT,

    CONSTRAINT "Release_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Release_teamId_idx" ON "Release"("teamId");

-- AddForeignKey
ALTER TABLE "Release" ADD CONSTRAINT "Release_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Release" ADD CONSTRAINT "Release_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Release" ADD CONSTRAINT "Release_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
