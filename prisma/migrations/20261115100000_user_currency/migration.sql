-- Display currency per user. Additive only: one column with a default, so every
-- existing account keeps showing rupees.

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'INR';
