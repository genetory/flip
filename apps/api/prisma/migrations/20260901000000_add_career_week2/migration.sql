-- Week 2 지원 패키지(Phase 5) — additive. 기존 테이블/컬럼/데이터 무변경.

-- CreateTable
CREATE TABLE "CareerApplicationTarget" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "cohortId" TEXT,
    "positionId" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'paste',
    "sourceUrl" TEXT,
    "companyName" TEXT,
    "jobTitle" TEXT,
    "rawContent" TEXT,
    "structuredData" JSONB NOT NULL DEFAULT '{}',
    "analysisData" JSONB,
    "status" TEXT NOT NULL DEFAULT 'captured',
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerApplicationTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerDocumentVersion" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "cohortId" TEXT,
    "documentType" TEXT NOT NULL,
    "variant" TEXT NOT NULL DEFAULT 'master',
    "applicationTargetId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "content" JSONB NOT NULL DEFAULT '{}',
    "sourceLinks" JSONB NOT NULL DEFAULT '[]',
    "validationData" JSONB,
    "generatedBy" TEXT,
    "promptVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerDocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerApplicationPackage" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "cohortId" TEXT,
    "targetJobKey" TEXT,
    "applicationTargetId" TEXT NOT NULL,
    "resumeVersionId" TEXT,
    "coverVersionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "readinessScore" INTEGER,
    "scoreData" JSONB,
    "validationData" JSONB,
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerApplicationPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerInterviewQuestionSet" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "cohortId" TEXT,
    "applicationPackageId" TEXT,
    "questions" JSONB NOT NULL DEFAULT '[]',
    "promptVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerInterviewQuestionSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CareerApplicationTarget_studentUserId_idx" ON "CareerApplicationTarget"("studentUserId");

-- CreateIndex
CREATE INDEX "CareerDocumentVersion_studentUserId_documentType_idx" ON "CareerDocumentVersion"("studentUserId", "documentType");

-- CreateIndex
CREATE INDEX "CareerDocumentVersion_studentUserId_applicationTargetId_idx" ON "CareerDocumentVersion"("studentUserId", "applicationTargetId");

-- CreateIndex
CREATE INDEX "CareerApplicationPackage_studentUserId_idx" ON "CareerApplicationPackage"("studentUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CareerApplicationPackage_studentUserId_applicationTargetId_key" ON "CareerApplicationPackage"("studentUserId", "applicationTargetId");

-- CreateIndex
CREATE INDEX "CareerInterviewQuestionSet_studentUserId_idx" ON "CareerInterviewQuestionSet"("studentUserId");

-- AddForeignKey
ALTER TABLE "CareerApplicationTarget" ADD CONSTRAINT "CareerApplicationTarget_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerDocumentVersion" ADD CONSTRAINT "CareerDocumentVersion_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerApplicationPackage" ADD CONSTRAINT "CareerApplicationPackage_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerInterviewQuestionSet" ADD CONSTRAINT "CareerInterviewQuestionSet_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
