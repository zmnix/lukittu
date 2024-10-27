/*
  Warnings:

  - You are about to drop the column `downloadUrl` on the `Release` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[productId,version]` on the table `Release` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Release" DROP COLUMN "downloadUrl",
ADD COLUMN     "fileKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Release_productId_version_key" ON "Release"("productId", "version");
