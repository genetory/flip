CREATE TYPE "CandidateVisaType" AS ENUM (
  'D10_JOB_SEEKING',
  'D2_STUDENT',
  'D4_GENERAL_TRAINING',
  'F2_RESIDENCE',
  'F4_OVERSEAS_KOREAN',
  'F5_PERMANENT_RESIDENCE',
  'F6_MARRIAGE_IMMIGRATION',
  'E7_SPECIFIC_ACTIVITY',
  'H1_WORKING_HOLIDAY',
  'OTHER'
);

CREATE TABLE "CandidateProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "workPermit" BOOLEAN,
  "visaType" "CandidateVisaType",
  "visaExpiryDate" TIMESTAMP(3),
  "livesInKorea" BOOLEAN,
  "hasAccommodation" BOOLEAN,
  "residenceProvince" TEXT,
  "residenceDistrict" TEXT,
  "residenceAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CandidateProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CandidateProfile_userId_key" ON "CandidateProfile"("userId");
CREATE INDEX "CandidateProfile_visaType_idx" ON "CandidateProfile"("visaType");
CREATE INDEX "CandidateProfile_livesInKorea_idx" ON "CandidateProfile"("livesInKorea");

ALTER TABLE "CandidateProfile"
ADD CONSTRAINT "CandidateProfile_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
