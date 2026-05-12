-- Add WITHDRAWN to ApplicationStatus enum
ALTER TYPE "ApplicationStatus" ADD VALUE 'WITHDRAWN';

-- Add visibility enum
CREATE TYPE "ApplicationCommentVisibility" AS ENUM ('INTERNAL', 'CANDIDATE');

-- Add withdrawnAt column to Application
ALTER TABLE "Application" ADD COLUMN "withdrawnAt" TIMESTAMP(3);

-- Create ApplicationComment table
CREATE TABLE "ApplicationComment" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "authorRole" "MemberRole" NOT NULL,
    "content" TEXT NOT NULL,
    "visibility" "ApplicationCommentVisibility" NOT NULL DEFAULT 'INTERNAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApplicationComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ApplicationComment_applicationId_idx" ON "ApplicationComment"("applicationId");
CREATE INDEX "ApplicationComment_authorUserId_idx" ON "ApplicationComment"("authorUserId");
CREATE INDEX "ApplicationComment_createdAt_idx" ON "ApplicationComment"("createdAt");

ALTER TABLE "ApplicationComment" ADD CONSTRAINT "ApplicationComment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationComment" ADD CONSTRAINT "ApplicationComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
