-- 기업 인재 검색 노출 끄기(가입하면 기본 노출, 학생이 끄면 시각을 남긴다).
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "talentPoolOptedOutAt" TIMESTAMP(3);
