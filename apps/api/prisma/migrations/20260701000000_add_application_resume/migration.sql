-- 일반 공고 지원(Application)에 대표 이력서(resume-maker Resume) 연결.
-- 지원 시점 이력서를 저장하고, 이력서 삭제 시 지원은 유지하되 링크만 null(SET NULL).
ALTER TABLE "Application" ADD COLUMN "resumeId" TEXT;
CREATE INDEX "Application_resumeId_idx" ON "Application"("resumeId");
ALTER TABLE "Application" ADD CONSTRAINT "Application_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE SET NULL ON UPDATE CASCADE;
