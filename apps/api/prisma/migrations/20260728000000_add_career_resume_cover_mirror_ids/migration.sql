-- career-launch 이력서/자소서를 실제 aply.global Resume/CoverLetter 로 자동 미러링하기 위한 링크 컬럼.
-- 저장 시마다 동기화하며, 여기에 미러 대상 id 를 보관한다(느슨한 링크, FK 아님).
ALTER TABLE "CareerResumeData" ADD COLUMN "resumeId" TEXT;
ALTER TABLE "CareerCoverLetterData" ADD COLUMN "coverLetterId" TEXT;
