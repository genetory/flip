-- CreateEnum
CREATE TYPE "IssueReportType" AS ENUM ('NO_SHOW', 'BEHAVIOR', 'DROPOUT', 'ATTITUDE', 'PAYMENT', 'OTHER');
CREATE TYPE "IssueReportStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "IssueReport" (
    "id" TEXT NOT NULL,
    "type" "IssueReportType" NOT NULL,
    "status" "IssueReportStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reporterUserId" TEXT NOT NULL,
    "subjectUserId" TEXT,
    "positionId" TEXT,
    "applicationId" TEXT,
    "assignedToUserId" TEXT,
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "IssueReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IssueReport_status_idx" ON "IssueReport"("status");
CREATE INDEX "IssueReport_type_idx" ON "IssueReport"("type");
CREATE INDEX "IssueReport_reporterUserId_idx" ON "IssueReport"("reporterUserId");
CREATE INDEX "IssueReport_assignedToUserId_idx" ON "IssueReport"("assignedToUserId");
CREATE INDEX "IssueReport_createdAt_idx" ON "IssueReport"("createdAt");

-- AddForeignKey
ALTER TABLE "IssueReport" ADD CONSTRAINT "IssueReport_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IssueReport" ADD CONSTRAINT "IssueReport_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IssueReport" ADD CONSTRAINT "IssueReport_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
