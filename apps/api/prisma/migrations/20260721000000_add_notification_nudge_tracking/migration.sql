-- 자동 넛지/리마인더 추적 컬럼
ALTER TABLE "Application" ADD COLUMN "partnerNudgedAt" TIMESTAMP(3);
ALTER TABLE "Application" ADD COLUMN "applicantInterviewNudgedAt" TIMESTAMP(3);
ALTER TABLE "InterviewSlot" ADD COLUMN "reminderSentAt" TIMESTAMP(3);
