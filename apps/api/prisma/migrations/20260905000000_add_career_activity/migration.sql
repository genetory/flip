-- Phase 10 계기(instrumentation) — additive. 기존 테이블/컬럼/데이터 무변경(비용 유니크만 확장).

-- CareerAiCostDaily 에 promptVersion 차원 추가(프롬프트 개선 전후 비교). 기존 유니크 → 확장.
ALTER TABLE "CareerAiCostDaily" ADD COLUMN "promptVersion" TEXT NOT NULL DEFAULT '';
DROP INDEX IF EXISTS "CareerAiCostDaily_cohortId_feature_dateKey_model_key";
CREATE UNIQUE INDEX "CareerAiCostDaily_cohortId_feature_dateKey_model_promptVersion_key" ON "CareerAiCostDaily"("cohortId", "feature", "dateKey", "model", "promptVersion");

-- 행동 이벤트(append-only) — 다음 파일럿 분석용. 원문 없음.
CREATE TABLE "CareerActivityEvent" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "cohortId" TEXT,
    "kind" TEXT NOT NULL,
    "week" INTEGER,
    "step" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CareerActivityEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CareerActivityEvent_cohortId_kind_idx" ON "CareerActivityEvent"("cohortId", "kind");
CREATE INDEX "CareerActivityEvent_studentUserId_createdAt_idx" ON "CareerActivityEvent"("studentUserId", "createdAt");
ALTER TABLE "CareerActivityEvent" ADD CONSTRAINT "CareerActivityEvent_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
