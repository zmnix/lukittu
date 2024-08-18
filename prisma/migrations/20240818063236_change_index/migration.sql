-- DropIndex
DROP INDEX "License_teamId_idx";

-- CreateIndex
CREATE INDEX "License_teamId_licenseKey_idx" ON "License"("teamId", "licenseKey");
