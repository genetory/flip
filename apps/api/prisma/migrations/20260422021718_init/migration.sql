-- CreateEnum
CREATE TYPE "PositionStatus" AS ENUM ('DRAFT', 'OPEN', 'MATCHING', 'CLOSED');

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "partnerOrganizationId" TEXT,
    "title" TEXT NOT NULL,
    "status" "PositionStatus" NOT NULL DEFAULT 'DRAFT',
    "matchingParticipants" TEXT[],
    "postingProgressLogs" TEXT[],
    "preferredNationalities" TEXT[],
    "communicationLanguages" TEXT[],
    "hiringProcess" TEXT,
    "preferredJobRole" TEXT,
    "hiringCount" INTEGER,
    "workingHours" TEXT,
    "mainResponsibilities" TEXT,
    "requiredQualifications" TEXT,
    "preferredQualifications" TEXT,
    "dressCode" TEXT,
    "wantsPreTraining" BOOLEAN,
    "additionalNotes" TEXT,
    "adminMemo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Position_partnerOrganizationId_idx" ON "Position"("partnerOrganizationId");

-- CreateIndex
CREATE INDEX "Position_status_idx" ON "Position"("status");

-- CreateIndex
CREATE INDEX "Position_title_idx" ON "Position"("title");

-- CreateIndex
CREATE INDEX "Position_createdAt_idx" ON "Position"("createdAt");

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_partnerOrganizationId_fkey" FOREIGN KEY ("partnerOrganizationId") REFERENCES "PartnerOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
