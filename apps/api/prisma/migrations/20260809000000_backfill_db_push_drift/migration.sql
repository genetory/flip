-- Catch-up: 2026-07-30 이후 로컬 db push 로만 반영돼 마이그레이션이 누락됐던 스키마를
-- 백필한다. API 컨테이너는 시작 시 `prisma migrate deploy` 로만 스키마를 적용하므로,
-- 이 백필이 없으면 스테이징·프로덕션 DB에 아래 테이블/컬럼이 없어 해당 기능이 실패한다.
--   • PartnerSavedCandidate  — 파트너 '관심 인재' 저장
--   • MockInterviewSession   — 공고별 모의 면접 연습 기록
--   • ApplicantDocSummary    — 지원 서류 LLM 요약 캐시
--   • User/PartnerOrganization/Position 신규 컬럼(회사 요약·인재풀 동의·모의면접 등)
-- 마이그레이션 이력이 완전히 재생성되지 않는 상태라, 대상 DB에 일부가 이미 존재해도
-- 안전하도록 전부 멱등(IF NOT EXISTS / DO 블록)으로 작성한다.

-- ── 신규 컬럼 ──────────────────────────────────────────────
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "talentPoolConsentedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "followedCompanyNames" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "PartnerOrganization" ADD COLUMN IF NOT EXISTS "descriptionSummary" TEXT;
ALTER TABLE "PartnerOrganization" ADD COLUMN IF NOT EXISTS "descriptionSummaryVersion" TEXT;
ALTER TABLE "Position" ADD COLUMN IF NOT EXISTS "mockInterviewIntent" TEXT;
ALTER TABLE "Position" ADD COLUMN IF NOT EXISTS "mockInterviewQuestions" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- ── PartnerSavedCandidate (관심 인재) ─────────────────────
CREATE TABLE IF NOT EXISTS "PartnerSavedCandidate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "candidateUserId" TEXT NOT NULL,
    "savedByUserId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PartnerSavedCandidate_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PartnerSavedCandidate_organizationId_candidateUserId_key" ON "PartnerSavedCandidate"("organizationId", "candidateUserId");
CREATE INDEX IF NOT EXISTS "PartnerSavedCandidate_organizationId_idx" ON "PartnerSavedCandidate"("organizationId");

-- ── MockInterviewSession (모의 면접 세션) ──────────────────
CREATE TABLE IF NOT EXISTS "MockInterviewSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "answeredCount" INTEGER NOT NULL DEFAULT 0,
    "bestScore" INTEGER,
    "answers" JSONB NOT NULL DEFAULT '[]',
    "lastPracticedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MockInterviewSession_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MockInterviewSession_userId_positionId_key" ON "MockInterviewSession"("userId", "positionId");
CREATE INDEX IF NOT EXISTS "MockInterviewSession_positionId_idx" ON "MockInterviewSession"("positionId");

-- ── ApplicantDocSummary (지원 서류 LLM 요약 캐시) ─────────
CREATE TABLE IF NOT EXISTS "ApplicantDocSummary" (
    "id" TEXT NOT NULL,
    "candidateUserId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "resumeBullets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "coverBullets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApplicantDocSummary_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ApplicantDocSummary_candidateUserId_key" ON "ApplicantDocSummary"("candidateUserId");

-- ── 외래키 (이미 있으면 무시) ─────────────────────────────
DO $$ BEGIN
  ALTER TABLE "MockInterviewSession" ADD CONSTRAINT "MockInterviewSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "MockInterviewSession" ADD CONSTRAINT "MockInterviewSession_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "ApplicantDocSummary" ADD CONSTRAINT "ApplicantDocSummary_candidateUserId_fkey" FOREIGN KEY ("candidateUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
