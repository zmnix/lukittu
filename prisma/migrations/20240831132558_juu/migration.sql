/*
  Warnings:

  - You are about to drop the column `customerId` on the `License` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "License" DROP CONSTRAINT "License_customerId_fkey";

-- AlterTable
ALTER TABLE "License" DROP COLUMN "customerId";

-- CreateTable
CREATE TABLE "_CustomerToLicense" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CustomerToLicense_AB_unique" ON "_CustomerToLicense"("A", "B");

-- CreateIndex
CREATE INDEX "_CustomerToLicense_B_index" ON "_CustomerToLicense"("B");

-- AddForeignKey
ALTER TABLE "_CustomerToLicense" ADD CONSTRAINT "_CustomerToLicense_A_fkey" FOREIGN KEY ("A") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomerToLicense" ADD CONSTRAINT "_CustomerToLicense_B_fkey" FOREIGN KEY ("B") REFERENCES "License"("id") ON DELETE CASCADE ON UPDATE CASCADE;
