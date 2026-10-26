-- 운영팀이 직접 정하는 매칭 상태(학교 제휴 일괄 등록 학생 등)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "opsMatchStatus" TEXT NOT NULL DEFAULT 'NONE';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "opsMatchNote" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "opsMatchUpdatedAt" TIMESTAMP(3);
