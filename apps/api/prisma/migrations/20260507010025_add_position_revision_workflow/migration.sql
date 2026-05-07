-- CreateEnum
CREATE TYPE "PositionRevisionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "PositionRevision" (
    "id" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "partnerOrganizationId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "status" "PositionRevisionStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "reviewNote" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PositionRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PositionRevision_positionId_idx" ON "PositionRevision"("positionId");

-- CreateIndex
CREATE INDEX "PositionRevision_partnerOrganizationId_idx" ON "PositionRevision"("partnerOrganizationId");

-- CreateIndex
CREATE INDEX "PositionRevision_requestedByUserId_idx" ON "PositionRevision"("requestedByUserId");

-- CreateIndex
CREATE INDEX "PositionRevision_reviewedByUserId_idx" ON "PositionRevision"("reviewedByUserId");

-- CreateIndex
CREATE INDEX "PositionRevision_status_idx" ON "PositionRevision"("status");

-- CreateIndex
CREATE INDEX "PositionRevision_createdAt_idx" ON "PositionRevision"("createdAt");

-- CreateIndex
CREATE INDEX "PartnerOrganization_slug_idx" ON "PartnerOrganization"("slug");

-- AddForeignKey
ALTER TABLE "PositionRevision" ADD CONSTRAINT "PositionRevision_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionRevision" ADD CONSTRAINT "PositionRevision_partnerOrganizationId_fkey" FOREIGN KEY ("partnerOrganizationId") REFERENCES "PartnerOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionRevision" ADD CONSTRAINT "PositionRevision_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionRevision" ADD CONSTRAINT "PositionRevision_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
