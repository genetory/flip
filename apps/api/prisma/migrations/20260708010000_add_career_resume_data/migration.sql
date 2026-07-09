-- CreateTable
CREATE TABLE "CareerResumeData" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "content" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerResumeData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CareerResumeData_studentUserId_key" ON "CareerResumeData"("studentUserId");

-- AddForeignKey
ALTER TABLE "CareerResumeData" ADD CONSTRAINT "CareerResumeData_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

