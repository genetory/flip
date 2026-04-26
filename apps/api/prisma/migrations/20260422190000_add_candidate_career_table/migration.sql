-- CreateTable
CREATE TABLE "CandidateCareer" (
    "id" TEXT NOT NULL,
    "candidateProfileId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "department" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateCareer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CandidateCareer_candidateProfileId_idx" ON "CandidateCareer"("candidateProfileId");

-- CreateIndex
CREATE INDEX "CandidateCareer_isCurrent_idx" ON "CandidateCareer"("isCurrent");

-- AddForeignKey
ALTER TABLE "CandidateCareer" ADD CONSTRAINT "CandidateCareer_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
