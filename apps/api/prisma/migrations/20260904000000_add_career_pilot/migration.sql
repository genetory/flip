-- Phase 9 파일럿 운영·측정 — additive. 기존 테이블/컬럼/데이터 무변경.

-- CareerCohort 파일럿 config 컬럼(모두 nullable/default → 기존 행 안전).
ALTER TABLE "CareerCohort"
  ADD COLUMN "isPilot" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "programVersion" TEXT,
  ADD COLUMN "featureFlags" JSONB,
  ADD COLUMN "participantLimit" INTEGER,
  ADD COLUMN "pilotStartAt" TIMESTAMP(3),
  ADD COLUMN "pilotEndAt" TIMESTAMP(3),
  ADD COLUMN "surveyConfiguration" JSONB,
  ADD COLUMN "monitoringConfiguration" JSONB;

-- 파일럿 주차별 짧은 설문 응답.
CREATE TABLE "CareerPilotSurvey" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "cohortId" TEXT,
    "surveyKey" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CareerPilotSurvey_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CareerPilotSurvey_studentUserId_surveyKey_key" ON "CareerPilotSurvey"("studentUserId", "surveyKey");
CREATE INDEX "CareerPilotSurvey_cohortId_surveyKey_idx" ON "CareerPilotSurvey"("cohortId", "surveyKey");
ALTER TABLE "CareerPilotSurvey" ADD CONSTRAINT "CareerPilotSurvey_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 정성 피드백 신호(원문 미저장).
CREATE TABLE "CareerQualitativeFeedback" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "cohortId" TEXT,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "currentWeek" INTEGER,
    "currentStep" TEXT,
    "sessionId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CareerQualitativeFeedback_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CareerQualitativeFeedback_cohortId_category_idx" ON "CareerQualitativeFeedback"("cohortId", "category");
CREATE INDEX "CareerQualitativeFeedback_studentUserId_idx" ON "CareerQualitativeFeedback"("studentUserId");
ALTER TABLE "CareerQualitativeFeedback" ADD CONSTRAINT "CareerQualitativeFeedback_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- LLM 비용 일별 집계.
CREATE TABLE "CareerAiCostDaily" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT,
    "feature" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT '',
    "calls" INTEGER NOT NULL DEFAULT 0,
    "inputTokens" BIGINT NOT NULL DEFAULT 0,
    "outputTokens" BIGINT NOT NULL DEFAULT 0,
    "retries" INTEGER NOT NULL DEFAULT 0,
    "cacheHits" INTEGER NOT NULL DEFAULT 0,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "estCostUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CareerAiCostDaily_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CareerAiCostDaily_cohortId_feature_dateKey_model_key" ON "CareerAiCostDaily"("cohortId", "feature", "dateKey", "model");
CREATE INDEX "CareerAiCostDaily_cohortId_dateKey_idx" ON "CareerAiCostDaily"("cohortId", "dateKey");
