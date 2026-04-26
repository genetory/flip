CREATE TYPE "CandidateProgramDuration" AS ENUM (
  'WEEKS_6',
  'WEEKS_8',
  'WEEKS_10',
  'WEEKS_12',
  'WEEKS_14',
  'WEEKS_16',
  'NEGOTIABLE'
);

CREATE TYPE "CandidateProgramStartOption" AS ENUM (
  'ASAP',
  'SPECIFIC_DATE'
);

CREATE TYPE "CandidatePreferredJobRole" AS ENUM (
  'SOFTWARE_DEVELOPMENT',
  'FRONTEND_DEVELOPMENT',
  'BACKEND_DEVELOPMENT',
  'DATA_ANALYSIS_SCIENCE',
  'UI_UX_DESIGN',
  'PRODUCT_MANAGER',
  'MARKETING',
  'SALES',
  'HR',
  'FINANCE_ACCOUNTING',
  'OPERATIONS_PLANNING',
  'OTHER'
);

ALTER TABLE "CandidateProfile"
ADD COLUMN "preferredProgramDuration" "CandidateProgramDuration",
ADD COLUMN "programStartOption" "CandidateProgramStartOption",
ADD COLUMN "programStartDate" TIMESTAMP(3),
ADD COLUMN "preferredIndustries" "PartnerIndustry"[] DEFAULT ARRAY[]::"PartnerIndustry"[],
ADD COLUMN "preferredJobRoles" "CandidatePreferredJobRole"[] DEFAULT ARRAY[]::"CandidatePreferredJobRole"[],
ADD COLUMN "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "selfIntroduction" TEXT,
ADD COLUMN "programMotivation" TEXT;
