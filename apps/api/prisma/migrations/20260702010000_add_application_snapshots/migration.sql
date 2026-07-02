-- 지원(Application) 제출 시점 서류 스냅샷 + 자소서 연결.
-- resumeSnapshot/coverLetterSnapshot: 제출 당시 내용 사본(원본 수정과 독립).
ALTER TABLE "Application" ADD COLUMN "resumeSnapshot" JSONB;
ALTER TABLE "Application" ADD COLUMN "coverLetterId" TEXT;
ALTER TABLE "Application" ADD COLUMN "coverLetterSnapshot" JSONB;
CREATE INDEX "Application_coverLetterId_idx" ON "Application"("coverLetterId");
ALTER TABLE "Application" ADD CONSTRAINT "Application_coverLetterId_fkey" FOREIGN KEY ("coverLetterId") REFERENCES "CoverLetter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
