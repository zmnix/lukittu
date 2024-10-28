-- DropForeignKey
ALTER TABLE "Blacklist" DROP CONSTRAINT "Blacklist_teamId_fkey";

-- DropForeignKey
ALTER TABLE "Release" DROP CONSTRAINT "Release_productId_fkey";

-- AddForeignKey
ALTER TABLE "Blacklist" ADD CONSTRAINT "Blacklist_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Release" ADD CONSTRAINT "Release_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
