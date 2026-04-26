-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "eligibleVisas" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "workType" TEXT;
