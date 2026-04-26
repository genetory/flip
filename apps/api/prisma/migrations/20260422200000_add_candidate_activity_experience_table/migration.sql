CREATE TYPE "CandidateActivityType" AS ENUM (
  'PROJECT',
  'VOLUNTEER',
  'INTERNSHIP',
  'CERTIFICATE',
  'AWARD',
  'EXTRACURRICULAR',
  'OTHER'
);

CREATE TABLE "CandidateActivityExperience" (
  "id" TEXT NOT NULL,
  "candidateProfileId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "activityType" "CandidateActivityType" NOT NULL,
  "organization" TEXT,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "description" TEXT,
  "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CandidateActivityExperience_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CandidateActivityExperience_candidateProfileId_idx" ON "CandidateActivityExperience"("candidateProfileId");
CREATE INDEX "CandidateActivityExperience_activityType_idx" ON "CandidateActivityExperience"("activityType");

ALTER TABLE "CandidateActivityExperience"
ADD CONSTRAINT "CandidateActivityExperience_candidateProfileId_fkey"
FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
