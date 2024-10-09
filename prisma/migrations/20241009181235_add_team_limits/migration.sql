-- CreateTable
CREATE TABLE "Limits" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "maxLicenses" INTEGER NOT NULL DEFAULT 100,
    "maxProducts" INTEGER NOT NULL DEFAULT 3,
    "logRetention" INTEGER NOT NULL DEFAULT 30,
    "maxCustomers" INTEGER NOT NULL DEFAULT 100,
    "maxTeamMembers" INTEGER NOT NULL DEFAULT 10,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Limits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Limits_teamId_key" ON "Limits"("teamId");

-- AddForeignKey
ALTER TABLE "Limits" ADD CONSTRAINT "Limits_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
