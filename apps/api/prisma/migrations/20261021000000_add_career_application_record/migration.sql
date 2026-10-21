-- Career Launch 지원 현황 — 학생이 직접 기록하는 지원(어플라이·원티드 공고 또는 외부 공고), 단계 이력, 공고 분석, 불합격 회고.
-- additive: 새 테이블 하나. 기존 테이블·데이터 무변경.

CREATE TABLE "CareerApplicationRecord" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "positionId" TEXT,
    "companyName" TEXT NOT NULL DEFAULT '',
    "jobTitle" TEXT NOT NULL DEFAULT '',
    "sourceUrl" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'planned',
    "stageHistory" JSONB NOT NULL DEFAULT '[]',
    "rejectedAtStage" TEXT,
    "analysisData" JSONB,
    "retroData" JSONB,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerApplicationRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CareerApplicationRecord_studentUserId_updatedAt_idx" ON "CareerApplicationRecord"("studentUserId", "updatedAt");
CREATE UNIQUE INDEX "CareerApplicationRecord_studentUserId_positionId_key" ON "CareerApplicationRecord"("studentUserId", "positionId");

ALTER TABLE "CareerApplicationRecord" ADD CONSTRAINT "CareerApplicationRecord_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
