/*
  Warnings:

  - You are about to drop the column `disabled` on the `License` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "License" DROP COLUMN "disabled",
ADD COLUMN     "suspended" BOOLEAN NOT NULL DEFAULT false;
