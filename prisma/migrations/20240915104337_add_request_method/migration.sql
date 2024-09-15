/*
  Warnings:

  - Added the required column `method` to the `RequestLog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RequestMethod" AS ENUM ('GET', 'POST', 'PUT', 'PATCH', 'DELETE');

-- AlterTable
ALTER TABLE "RequestLog" ADD COLUMN     "method" "RequestMethod" NOT NULL;
