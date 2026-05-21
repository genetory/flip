-- Rich structured detail blocks for the saju result page.
-- Kept as a single jsonb column so we can iterate on the section list
-- (strengths, work environment, per-role reasoning, etc.) without
-- another migration each time.
ALTER TABLE "SajuPrediction" ADD COLUMN "details" JSONB;
