CREATE TYPE "CandidateEducationType" AS ENUM (
  'HIGH_SCHOOL',
  'ASSOCIATE',
  'BACHELOR',
  'MASTER',
  'DOCTOR',
  'BOOTCAMP',
  'CERTIFICATE',
  'OTHER'
);

CREATE TYPE "CandidateEducationStatus" AS ENUM (
  'ENROLLED',
  'GRADUATED',
  'LEAVE_OF_ABSENCE',
  'DROPPED_OUT',
  'OTHER'
);

CREATE TYPE "CandidateLanguageType" AS ENUM (
  'KOREAN',
  'ENGLISH',
  'CHINESE',
  'JAPANESE',
  'VIETNAMESE',
  'INDONESIAN',
  'THAI',
  'MALAY',
  'FILIPINO',
  'HINDI',
  'SPANISH',
  'FRENCH',
  'GERMAN',
  'OTHER'
);

CREATE TYPE "CandidateLanguageLevel" AS ENUM (
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
  'NATIVE'
);

CREATE TABLE "CandidateEducation" (
  "id" TEXT NOT NULL,
  "candidateProfileId" TEXT NOT NULL,
  "schoolName" TEXT NOT NULL,
  "educationType" "CandidateEducationType" NOT NULL,
  "major" TEXT,
  "status" "CandidateEducationStatus" NOT NULL,
  "country" TEXT,
  "city" TEXT,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "isKoreanSchool" BOOLEAN,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CandidateEducation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CandidateLanguageSkill" (
  "id" TEXT NOT NULL,
  "candidateProfileId" TEXT NOT NULL,
  "language" "CandidateLanguageType" NOT NULL,
  "level" "CandidateLanguageLevel" NOT NULL,
  "testName" TEXT,
  "score" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CandidateLanguageSkill_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CandidateEducation_candidateProfileId_idx" ON "CandidateEducation"("candidateProfileId");
CREATE INDEX "CandidateEducation_educationType_idx" ON "CandidateEducation"("educationType");
CREATE INDEX "CandidateEducation_status_idx" ON "CandidateEducation"("status");

CREATE INDEX "CandidateLanguageSkill_candidateProfileId_idx" ON "CandidateLanguageSkill"("candidateProfileId");
CREATE INDEX "CandidateLanguageSkill_language_idx" ON "CandidateLanguageSkill"("language");
CREATE INDEX "CandidateLanguageSkill_level_idx" ON "CandidateLanguageSkill"("level");

ALTER TABLE "CandidateEducation"
ADD CONSTRAINT "CandidateEducation_candidateProfileId_fkey"
FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CandidateLanguageSkill"
ADD CONSTRAINT "CandidateLanguageSkill_candidateProfileId_fkey"
FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
