-- CandidateProfile.followedCompanyNames 드리프트 수정.
-- 20260809000000_backfill_db_push_drift 가 이 컬럼을 실수로 "User" 에 추가했지만,
-- 스키마는 "CandidateProfile" 에 정의한다. 그 결과 프로덕션 DB 의 CandidateProfile 에는
-- 컬럼이 없어 Prisma 의 candidateProfile.upsert/find 가 전부 실패(관심 회사·즐겨찾기 저장 500).
-- 올바른 테이블에 멱등으로 추가한다.
ALTER TABLE "CandidateProfile" ADD COLUMN IF NOT EXISTS "followedCompanyNames" TEXT[] DEFAULT ARRAY[]::TEXT[];
UPDATE "CandidateProfile" SET "followedCompanyNames" = COALESCE("followedCompanyNames", ARRAY[]::TEXT[]);
ALTER TABLE "CandidateProfile" ALTER COLUMN "followedCompanyNames" SET NOT NULL;
