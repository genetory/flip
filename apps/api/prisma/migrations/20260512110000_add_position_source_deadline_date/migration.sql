-- AlterTable: add structured deadline column promoted from additionalNotes
ALTER TABLE "Position" ADD COLUMN "sourceDeadlineDate" TIMESTAMP(3);

-- Backfill from the legacy `sourceDeadlineDate: YYYY-MM-DD` line that the
-- Wanted importer used to embed into additionalNotes.
UPDATE "Position"
SET "sourceDeadlineDate" = (
  CASE
    WHEN substring("additionalNotes" FROM 'sourceDeadlineDate:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})') IS NOT NULL
      THEN to_timestamp(substring("additionalNotes" FROM 'sourceDeadlineDate:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})'), 'YYYY-MM-DD')
    ELSE NULL
  END
)
WHERE "additionalNotes" LIKE '%sourceDeadlineDate:%';

-- Index for ORDER BY sourceDeadlineDate ASC NULLS LAST (deadline-sort listing)
CREATE INDEX "Position_sourceDeadlineDate_idx" ON "Position" ("sourceDeadlineDate");
