/*
  Warnings:

  - You are about to drop the column `clientIdentifier` on the `Heartbeat` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[licenseId,deviceIdentifier]` on the table `Heartbeat` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `deviceIdentifier` to the `Heartbeat` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Heartbeat_licenseId_clientIdentifier_key";

-- AlterTable
ALTER TABLE "Heartbeat" DROP COLUMN "clientIdentifier",
ADD COLUMN     "deviceIdentifier" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Heartbeat_licenseId_deviceIdentifier_key" ON "Heartbeat"("licenseId", "deviceIdentifier");
