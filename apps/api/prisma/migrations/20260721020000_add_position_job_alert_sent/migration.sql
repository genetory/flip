-- 잡 얼럿 중복 발송 방지
ALTER TABLE "Position" ADD COLUMN "jobAlertSentAt" TIMESTAMP(3);
