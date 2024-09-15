/*
  Warnings:

  - Added the required column `path` to the `RequestLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `statusCode` to the `RequestLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RequestLog" ADD COLUMN     "origin" TEXT,
ADD COLUMN     "path" TEXT NOT NULL,
ADD COLUMN     "statusCode" INTEGER NOT NULL,
ADD COLUMN     "userAgent" TEXT;
