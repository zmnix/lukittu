/*
  Warnings:

  - A unique constraint covering the columns `[name,teamId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Product_name_teamId_key" ON "Product"("name", "teamId");
