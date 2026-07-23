-- 이메일 알림 수신 설정(기본 true)
ALTER TABLE "User" ADD COLUMN "emailNotifications" BOOLEAN NOT NULL DEFAULT true;
