/*
  Warnings:

  - Made the column `productId` on table `Release` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Release" DROP CONSTRAINT "Release_productId_fkey";

-- AlterTable
ALTER TABLE "Release" ALTER COLUMN "productId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Release" ADD CONSTRAINT "Release_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
