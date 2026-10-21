-- 인재 검색 상세의 'AI 인재 인사이트'(어울리는 직무·강점·핵심 경험·준비 상태·확인할 점) 캐시 — 서류 요약 행에 함께 둔다.
-- additive: nullable 컬럼 두 개. 기존 행 데이터 무변경.

ALTER TABLE "ApplicantDocSummary" ADD COLUMN "insightData" JSONB;
ALTER TABLE "ApplicantDocSummary" ADD COLUMN "insightVersion" TEXT;
