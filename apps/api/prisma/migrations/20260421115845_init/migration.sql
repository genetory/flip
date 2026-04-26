-- CreateEnum
CREATE TYPE "PartnerApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "PartnerOrganization" ADD COLUMN     "approvalStatus" "PartnerApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "approvedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "PartnerOrganization_approvalStatus_idx" ON "PartnerOrganization"("approvalStatus");
