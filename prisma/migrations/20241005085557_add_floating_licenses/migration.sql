-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RequestStatus" ADD VALUE 'MAXIMUM_CONCURRENT_SEATS';
ALTER TYPE "RequestStatus" ADD VALUE 'TEAM_NOT_FOUND';

-- DropIndex
DROP INDEX "AuditLog_teamId_idx";

-- DropIndex
DROP INDEX "RequestLog_teamId_idx";

-- AlterTable
ALTER TABLE "License" ADD COLUMN     "seats" INTEGER;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "heartbeatTimeout" INTEGER NOT NULL DEFAULT 60;

-- CreateTable
CREATE TABLE "Heartbeat" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "clientIdentifier" TEXT NOT NULL,
    "lastBeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Heartbeat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Heartbeat_licenseId_clientIdentifier_key" ON "Heartbeat"("licenseId", "clientIdentifier");

-- CreateIndex
CREATE INDEX "AuditLog_teamId_createdAt_idx" ON "AuditLog"("teamId", "createdAt");

-- CreateIndex
CREATE INDEX "RequestLog_teamId_createdAt_idx" ON "RequestLog"("teamId", "createdAt");

-- AddForeignKey
ALTER TABLE "Heartbeat" ADD CONSTRAINT "Heartbeat_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License"("id") ON DELETE CASCADE ON UPDATE CASCADE;
