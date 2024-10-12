-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditLogAction" ADD VALUE 'CREATE_BLACKLIST';
ALTER TYPE "AuditLogAction" ADD VALUE 'DELETE_BLACKLIST';
ALTER TYPE "AuditLogAction" ADD VALUE 'UPDATE_BLACKLIST';
ALTER TYPE "AuditLogAction" ADD VALUE 'CREATE_API_KEY';
ALTER TYPE "AuditLogAction" ADD VALUE 'DELETE_API_KEY';

-- AlterTable
ALTER TABLE "Limits" ADD COLUMN     "maxBlacklist" INTEGER NOT NULL DEFAULT 100;
