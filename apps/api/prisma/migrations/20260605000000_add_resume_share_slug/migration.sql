-- Public share slug for resumes. Anyone with the link can view a read-only
-- single-page rendering of the resume; the column lives next to the id so
-- the existing `id` URL stays owner-private.

-- 1) Add column nullable first so the backfill can run.
ALTER TABLE "Resume" ADD COLUMN "shareSlug" TEXT;

-- 2) Backfill: build a deterministic unique slug from each row's uuid id
--    (dehyphenated). New rows minted by the app use Prisma's `cuid()`.
UPDATE "Resume" SET "shareSlug" = 'r_' || REPLACE("id"::text, '-', '')
WHERE "shareSlug" IS NULL;

-- 3) Lock it down: NOT NULL + unique index, matching the Prisma model.
ALTER TABLE "Resume" ALTER COLUMN "shareSlug" SET NOT NULL;
CREATE UNIQUE INDEX "Resume_shareSlug_key" ON "Resume"("shareSlug");
