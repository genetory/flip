-- 한패스 설문 소프트 중복 처리: 전화번호 기준 업서트를 위한 인덱스 + 수정 시각 컬럼.
-- AlterTable
ALTER TABLE "HanpassSurveyResponse"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "HanpassSurveyResponse_phone_idx" ON "HanpassSurveyResponse"("phone");
