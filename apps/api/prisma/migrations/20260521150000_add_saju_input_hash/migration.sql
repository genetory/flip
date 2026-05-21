-- Deterministic deduping: same identity inputs (name + gender + DOB +
-- birth time + calendar + locale) should always resolve to the same
-- prediction so repeat visitors and shared links stay stable. Existing
-- rows have NULL inputHash; the unique index does not prevent multiple
-- NULL values in Postgres, so backfill is unnecessary.
ALTER TABLE "SajuPrediction" ADD COLUMN "inputHash" TEXT;
CREATE UNIQUE INDEX "SajuPrediction_inputHash_key" ON "SajuPrediction"("inputHash");
