-- CreateEnum
CREATE TYPE "ReleaseType" AS ENUM ('MAJOR', 'MINOR', 'PATCH', 'HOTFIX');

-- CreateEnum
CREATE TYPE "ReleaseStatus" AS ENUM ('PUBLISHED', 'DRAFT', 'DEPRECATED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Releases" (
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

    CONSTRAINT "Releases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Releases_teamId_idx" ON "Releases"("teamId");

-- AddForeignKey
ALTER TABLE "Releases" ADD CONSTRAINT "Releases_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Releases" ADD CONSTRAINT "Releases_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Releases" ADD CONSTRAINT "Releases_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
