-- CreateTable
CREATE TABLE "CareerCoverLetterData" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "content" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerCoverLetterData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CareerCoverLetterData_studentUserId_key" ON "CareerCoverLetterData"("studentUserId");

-- AddForeignKey
ALTER TABLE "CareerCoverLetterData" ADD CONSTRAINT "CareerCoverLetterData_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

