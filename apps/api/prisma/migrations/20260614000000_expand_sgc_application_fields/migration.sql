-- Expand SgcApplication with the official-poster form fields.
--
-- These columns were applied to the local DB via `prisma db push` (the SGC
-- table itself was created the same way and is not in migration history).
-- This migration brings the migrate-deploy-managed staging/prod databases in
-- sync. Every statement is idempotent (ADD COLUMN IF NOT EXISTS / DROP NOT NULL)
-- so it is safe whether or not an environment was already db-pushed.
ALTER TABLE "SgcApplication"
  ADD COLUMN IF NOT EXISTS "applicantName" TEXT,
  ADD COLUMN IF NOT EXISTS "birthDate" TEXT,
  ADD COLUMN IF NOT EXISTS "gender" TEXT,
  ADD COLUMN IF NOT EXISTS "nationality" TEXT,
  ADD COLUMN IF NOT EXISTS "university" TEXT,
  ADD COLUMN IF NOT EXISTS "major" TEXT,
  ADD COLUMN IF NOT EXISTS "grade" TEXT,
  ADD COLUMN IF NOT EXISTS "expectedGraduation" TEXT,
  ADD COLUMN IF NOT EXISTS "koreaStayDuration" TEXT,
  ADD COLUMN IF NOT EXISTS "address" TEXT,
  ADD COLUMN IF NOT EXISTS "email" TEXT,
  ADD COLUMN IF NOT EXISTS "phone" TEXT,
  ADD COLUMN IF NOT EXISTS "referralSource" TEXT,
  ADD COLUMN IF NOT EXISTS "referralOther" TEXT,
  ADD COLUMN IF NOT EXISTS "topikLevel" TEXT,
  ADD COLUMN IF NOT EXISTS "topikCertUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "desiredJobs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "preTrainingConsent" BOOLEAN;

-- desiredJob moved from required to optional (legacy single value; new form
-- uses desiredJobs). Safe / no-op if already nullable.
ALTER TABLE "SgcApplication" ALTER COLUMN "desiredJob" DROP NOT NULL;
