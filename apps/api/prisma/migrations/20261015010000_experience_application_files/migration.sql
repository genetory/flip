-- 자소서 경험 발굴 캠페인 신청 — 경험 소개·자기소개서 텍스트 대신 파일 첨부(이력서 필수·자기소개서 선택).
-- additive: 파일 컬럼 4개 추가 + experience 를 NULL 허용으로. 기존 행 데이터 무변경.

ALTER TABLE "ExperienceCampaignApplication" ALTER COLUMN "experience" DROP NOT NULL;

ALTER TABLE "ExperienceCampaignApplication" ADD COLUMN "resumeUrl" TEXT;
ALTER TABLE "ExperienceCampaignApplication" ADD COLUMN "resumeFileName" TEXT;
ALTER TABLE "ExperienceCampaignApplication" ADD COLUMN "coverLetterUrl" TEXT;
ALTER TABLE "ExperienceCampaignApplication" ADD COLUMN "coverLetterFileName" TEXT;
