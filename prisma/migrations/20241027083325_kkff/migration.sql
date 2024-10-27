/*
  Warnings:

  - The values [HOTFIX] on the enum `ReleaseType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ReleaseType_new" AS ENUM ('MAJOR', 'MINOR', 'PATCH', 'OTHER');
ALTER TABLE "Release" ALTER COLUMN "releaseType" DROP DEFAULT;
ALTER TABLE "Release" ALTER COLUMN "releaseType" TYPE "ReleaseType_new" USING ("releaseType"::text::"ReleaseType_new");
ALTER TYPE "ReleaseType" RENAME TO "ReleaseType_old";
ALTER TYPE "ReleaseType_new" RENAME TO "ReleaseType";
DROP TYPE "ReleaseType_old";
ALTER TABLE "Release" ALTER COLUMN "releaseType" SET DEFAULT 'OTHER';
COMMIT;

-- AlterTable
ALTER TABLE "Release" ALTER COLUMN "releaseType" SET DEFAULT 'OTHER';
