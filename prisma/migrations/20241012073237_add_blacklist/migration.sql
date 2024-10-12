-- CreateEnum
CREATE TYPE "BlacklistType" AS ENUM ('DEVICE_IDENTIFIER', 'IP_ADDRESS', 'COUNTRY');

-- CreateTable
CREATE TABLE "Blacklist" (
    "id" TEXT NOT NULL,
    "type" "BlacklistType" NOT NULL,
    "value" TEXT NOT NULL,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "Blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Blacklist_teamId_idx" ON "Blacklist"("teamId");

-- AddForeignKey
ALTER TABLE "Blacklist" ADD CONSTRAINT "Blacklist_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
