-- Week 3~4 실전 모의면접 & 오답노트(Phase 6) — additive. 기존 테이블/컬럼/데이터 무변경.

-- CreateTable
CREATE TABLE "CareerInterviewSession" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "cohortId" TEXT,
    "applicationPackageId" TEXT,
    "sessionType" TEXT NOT NULL DEFAULT 'initial_mock',
    "status" TEXT NOT NULL DEFAULT 'ready',
    "inputMode" TEXT NOT NULL DEFAULT 'text',
    "questionSetVersion" TEXT,
    "scoringVersion" TEXT,
    "promptVersion" TEXT,
    "reportData" JSONB,
    "cursor" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CareerInterviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerInterviewQuestion" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sourceQuestionId" TEXT,
    "question" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sourceData" JSONB,
    "evaluationCriteria" JSONB NOT NULL DEFAULT '[]',
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "order" INTEGER NOT NULL DEFAULT 0,
    "parentQuestionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CareerInterviewQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerInterviewAnswer" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answerText" TEXT NOT NULL DEFAULT '',
    "audioAssetId" TEXT,
    "duration" INTEGER,
    "evaluationData" JSONB,
    "score" INTEGER,
    "confidence" DOUBLE PRECISION,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CareerInterviewAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerInterviewWeakness" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "cohortId" TEXT,
    "applicationPackageId" TEXT,
    "weaknessType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "coachingStrategy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CareerInterviewWeakness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerInterviewCorrection" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "cohortId" TEXT,
    "weaknessId" TEXT,
    "originalQuestionId" TEXT,
    "originalAnswerId" TEXT,
    "question" TEXT NOT NULL DEFAULT '',
    "questionType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'discovered',
    "coachingData" JSONB,
    "passCriteria" JSONB,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "transferAttemptCount" INTEGER NOT NULL DEFAULT 0,
    "initialScore" INTEGER,
    "latestScore" INTEGER,
    "passedAt" TIMESTAMP(3),
    "passReason" JSONB,
    "lastPracticedAt" TIMESTAMP(3),
    "nextPracticeAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CareerInterviewCorrection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerInterviewCorrectionAttempt" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "correctionId" TEXT NOT NULL,
    "sessionId" TEXT,
    "questionText" TEXT NOT NULL DEFAULT '',
    "answerText" TEXT NOT NULL DEFAULT '',
    "attemptType" TEXT NOT NULL DEFAULT 'same_question',
    "evaluationData" JSONB,
    "score" INTEGER,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CareerInterviewCorrectionAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerInterviewGrowthReport" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "cohortId" TEXT,
    "applicationPackageId" TEXT,
    "initialSessionId" TEXT,
    "finalSessionId" TEXT,
    "comparisonData" JSONB,
    "growthData" JSONB,
    "remainingWeaknesses" JSONB NOT NULL DEFAULT '[]',
    "nextActions" JSONB NOT NULL DEFAULT '{}',
    "humanReviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CareerInterviewGrowthReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CareerInterviewSession_studentUserId_sessionType_idx" ON "CareerInterviewSession"("studentUserId", "sessionType");
CREATE INDEX "CareerInterviewQuestion_studentUserId_sessionId_idx" ON "CareerInterviewQuestion"("studentUserId", "sessionId");
CREATE UNIQUE INDEX "CareerInterviewAnswer_sessionId_questionId_key" ON "CareerInterviewAnswer"("sessionId", "questionId");
CREATE INDEX "CareerInterviewAnswer_studentUserId_sessionId_idx" ON "CareerInterviewAnswer"("studentUserId", "sessionId");
CREATE INDEX "CareerInterviewWeakness_studentUserId_idx" ON "CareerInterviewWeakness"("studentUserId");
CREATE INDEX "CareerInterviewCorrection_studentUserId_idx" ON "CareerInterviewCorrection"("studentUserId");
CREATE INDEX "CareerInterviewCorrectionAttempt_studentUserId_correctionId_idx" ON "CareerInterviewCorrectionAttempt"("studentUserId", "correctionId");
CREATE UNIQUE INDEX "CareerInterviewGrowthReport_studentUserId_key" ON "CareerInterviewGrowthReport"("studentUserId");

-- AddForeignKey
ALTER TABLE "CareerInterviewSession" ADD CONSTRAINT "CareerInterviewSession_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareerInterviewQuestion" ADD CONSTRAINT "CareerInterviewQuestion_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareerInterviewAnswer" ADD CONSTRAINT "CareerInterviewAnswer_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareerInterviewWeakness" ADD CONSTRAINT "CareerInterviewWeakness_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareerInterviewCorrection" ADD CONSTRAINT "CareerInterviewCorrection_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareerInterviewCorrectionAttempt" ADD CONSTRAINT "CareerInterviewCorrectionAttempt_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareerInterviewGrowthReport" ADD CONSTRAINT "CareerInterviewGrowthReport_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
