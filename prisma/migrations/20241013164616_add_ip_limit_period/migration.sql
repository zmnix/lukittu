-- CreateEnum
CREATE TYPE "IpLimitPeriod" AS ENUM ('DAY', 'WEEK', 'MONTH');

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "ipLimitPeriod" "IpLimitPeriod" NOT NULL DEFAULT 'DAY';
