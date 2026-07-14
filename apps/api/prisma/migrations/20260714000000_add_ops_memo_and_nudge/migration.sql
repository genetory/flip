-- 운영자 학생 관리 확장
--   opsMemo      : 운영자 내부 메모(학생에게 보이지 않음)
--   lastNudgedAt : 마지막 독려 메일 발송 시각
--   nudgeCount   : 누적 독려 메일 발송 횟수
-- 모두 nullable 또는 기본값이 있어 기존 행에 영향 없음(파괴적 변경 아님).

-- AlterTable
ALTER TABLE "CareerLaunchProgress" ADD COLUMN     "lastNudgedAt" TIMESTAMP(3),
ADD COLUMN     "nudgeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "opsMemo" TEXT;
