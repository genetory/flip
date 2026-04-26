ALTER TABLE "CandidateProfile"
  ADD COLUMN IF NOT EXISTS "favoritePositionIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "appliedPositionIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

UPDATE "CandidateProfile"
SET "favoritePositionIds" = COALESCE("favoritePositionIds", ARRAY[]::TEXT[]),
    "appliedPositionIds" = COALESCE("appliedPositionIds", ARRAY[]::TEXT[]);

ALTER TABLE "CandidateProfile"
  ALTER COLUMN "favoritePositionIds" SET NOT NULL,
  ALTER COLUMN "appliedPositionIds" SET NOT NULL;
