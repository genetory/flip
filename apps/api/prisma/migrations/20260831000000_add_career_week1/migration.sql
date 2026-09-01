-- Week 1 직무 탐험(Phase 4) — additive. 기존 테이블/컬럼/데이터 무변경.

-- CreateTable
CREATE TABLE "CareerExperience" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "cohortId" TEXT,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "structuredData" JSONB NOT NULL DEFAULT '{}',
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relatedJobFamilies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source" TEXT,
    "confidence" DOUBLE PRECISION,
    "userConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerExperience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerJobTrial" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "cohortId" TEXT,
    "jobKey" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "promptData" JSONB NOT NULL DEFAULT '{}',
    "submissionData" JSONB,
    "evaluationData" JSONB,
    "score" INTEGER,
    "interestScore" INTEGER,
    "interestData" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerJobTrial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerTargetJob" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "cohortId" TEXT,
    "jobKey" TEXT NOT NULL,
    "targetType" TEXT NOT NULL DEFAULT 'primary',
    "status" TEXT NOT NULL DEFAULT 'provisional',
    "reason" TEXT,
    "readinessData" JSONB,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerTargetJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerJobDecisionReport" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "cohortId" TEXT,
    "comparedJobs" JSONB NOT NULL DEFAULT '[]',
    "recommendation" JSONB NOT NULL DEFAULT '{}',
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "concerns" JSONB NOT NULL DEFAULT '[]',
    "nextActions" JSONB NOT NULL DEFAULT '[]',
    "userDecision" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerJobDecisionReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CareerExperience_studentUserId_idx" ON "CareerExperience"("studentUserId");

-- CreateIndex
CREATE INDEX "CareerJobTrial_studentUserId_idx" ON "CareerJobTrial"("studentUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CareerJobTrial_studentUserId_jobKey_key" ON "CareerJobTrial"("studentUserId", "jobKey");

-- CreateIndex
CREATE INDEX "CareerTargetJob_studentUserId_idx" ON "CareerTargetJob"("studentUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CareerTargetJob_studentUserId_jobKey_key" ON "CareerTargetJob"("studentUserId", "jobKey");

-- CreateIndex
CREATE UNIQUE INDEX "CareerJobDecisionReport_studentUserId_key" ON "CareerJobDecisionReport"("studentUserId");

-- AddForeignKey
ALTER TABLE "CareerExperience" ADD CONSTRAINT "CareerExperience_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerJobTrial" ADD CONSTRAINT "CareerJobTrial_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerTargetJob" ADD CONSTRAINT "CareerTargetJob_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerJobDecisionReport" ADD CONSTRAINT "CareerJobDecisionReport_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
