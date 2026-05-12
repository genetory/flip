-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ProgramMeetingStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "SchoolCreditStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED');

-- CreateTable: Program
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "status" "ProgramStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Program_applicationId_key" ON "Program"("applicationId");
CREATE INDEX "Program_status_idx" ON "Program"("status");
ALTER TABLE "Program" ADD CONSTRAINT "Program_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: ProgramMeeting
CREATE TABLE "ProgramMeeting" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "agenda" TEXT,
    "notes" TEXT,
    "location" TEXT,
    "status" "ProgramMeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProgramMeeting_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProgramMeeting_programId_idx" ON "ProgramMeeting"("programId");
CREATE INDEX "ProgramMeeting_scheduledAt_idx" ON "ProgramMeeting"("scheduledAt");
CREATE INDEX "ProgramMeeting_status_idx" ON "ProgramMeeting"("status");
ALTER TABLE "ProgramMeeting" ADD CONSTRAINT "ProgramMeeting_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: ProgramFeedback
CREATE TABLE "ProgramFeedback" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "authorRole" "MemberRole" NOT NULL,
    "content" TEXT NOT NULL,
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProgramFeedback_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProgramFeedback_programId_idx" ON "ProgramFeedback"("programId");
CREATE INDEX "ProgramFeedback_authorUserId_idx" ON "ProgramFeedback"("authorUserId");
ALTER TABLE "ProgramFeedback" ADD CONSTRAINT "ProgramFeedback_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgramFeedback" ADD CONSTRAINT "ProgramFeedback_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: Certificate
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "issuedByUserId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Certificate_programId_key" ON "Certificate"("programId");
CREATE INDEX "Certificate_programId_idx" ON "Certificate"("programId");
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_issuedByUserId_fkey" FOREIGN KEY ("issuedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: Recommendation
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "signerTitle" TEXT,
    "issuedByUserId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Recommendation_programId_key" ON "Recommendation"("programId");
CREATE INDEX "Recommendation_programId_idx" ON "Recommendation"("programId");
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_issuedByUserId_fkey" FOREIGN KEY ("issuedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: SchoolCreditRequest
CREATE TABLE "SchoolCreditRequest" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "courseCode" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "status" "SchoolCreditStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "reviewNote" TEXT,
    CONSTRAINT "SchoolCreditRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SchoolCreditRequest_programId_key" ON "SchoolCreditRequest"("programId");
CREATE INDEX "SchoolCreditRequest_programId_idx" ON "SchoolCreditRequest"("programId");
CREATE INDEX "SchoolCreditRequest_status_idx" ON "SchoolCreditRequest"("status");
ALTER TABLE "SchoolCreditRequest" ADD CONSTRAINT "SchoolCreditRequest_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SchoolCreditRequest" ADD CONSTRAINT "SchoolCreditRequest_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: create Program records for existing ACCEPTED applications
INSERT INTO "Program" ("id", "applicationId", "startsAt", "createdAt", "updatedAt")
SELECT gen_random_uuid()::TEXT, "id", COALESCE("updatedAt", CURRENT_TIMESTAMP), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Application"
WHERE "status" = 'ACCEPTED'
ON CONFLICT ("applicationId") DO NOTHING;
