-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PositionStatus" ADD VALUE 'PENDING_REVIEW';
ALTER TYPE "PositionStatus" ADD VALUE 'APPROVED';
ALTER TYPE "PositionStatus" ADD VALUE 'PAUSED';
ALTER TYPE "PositionStatus" ADD VALUE 'REJECTED';

-- CreateTable
CREATE TABLE "PartnerApplicantWorkflow" (
    "id" TEXT NOT NULL,
    "partnerUserId" TEXT NOT NULL,
    "candidateUserId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerApplicantWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PartnerApplicantWorkflow_partnerUserId_idx" ON "PartnerApplicantWorkflow"("partnerUserId");

-- CreateIndex
CREATE INDEX "PartnerApplicantWorkflow_candidateUserId_idx" ON "PartnerApplicantWorkflow"("candidateUserId");

-- CreateIndex
CREATE INDEX "PartnerApplicantWorkflow_positionId_idx" ON "PartnerApplicantWorkflow"("positionId");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerApplicantWorkflow_partnerUserId_candidateUserId_posi_key" ON "PartnerApplicantWorkflow"("partnerUserId", "candidateUserId", "positionId");

-- AddForeignKey
ALTER TABLE "PartnerApplicantWorkflow" ADD CONSTRAINT "PartnerApplicantWorkflow_partnerUserId_fkey" FOREIGN KEY ("partnerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerApplicantWorkflow" ADD CONSTRAINT "PartnerApplicantWorkflow_candidateUserId_fkey" FOREIGN KEY ("candidateUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerApplicantWorkflow" ADD CONSTRAINT "PartnerApplicantWorkflow_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;
