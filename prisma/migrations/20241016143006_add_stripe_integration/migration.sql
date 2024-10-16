-- CreateTable
CREATE TABLE "StripeIntegration" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "webhookSecret" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StripeIntegration_teamId_key" ON "StripeIntegration"("teamId");

-- AddForeignKey
ALTER TABLE "StripeIntegration" ADD CONSTRAINT "StripeIntegration_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StripeIntegration" ADD CONSTRAINT "StripeIntegration_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
