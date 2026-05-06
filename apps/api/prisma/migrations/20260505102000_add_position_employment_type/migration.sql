-- CreateEnum
CREATE TYPE "PositionEmploymentType" AS ENUM ('FULL_TIME', 'INTERN', 'PART_TIME', 'UNPAID_INTERN');

-- AlterTable
ALTER TABLE "Position"
ADD COLUMN "employmentType" "PositionEmploymentType" NOT NULL DEFAULT 'INTERN';
