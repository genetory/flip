-- Step 1: Delete all positions imported from KOWORK (cascades to applications,
-- matching, status history etc. via existing FKs).
DELETE FROM "Position" WHERE "sourceProvider" = 'KOWORK';

-- Step 2: Recreate PositionSourceProvider enum without KOWORK.
-- Postgres has no direct "ALTER TYPE ... DROP VALUE", so we follow the
-- standard rename-and-swap pattern.
ALTER TYPE "PositionSourceProvider" RENAME TO "PositionSourceProvider_old";

CREATE TYPE "PositionSourceProvider" AS ENUM ('INTERNAL', 'BUDDIES', 'WANTED', 'OTHER');

-- Default needs to be dropped before the column type can change, then re-set.
ALTER TABLE "Position" ALTER COLUMN "sourceProvider" DROP DEFAULT;
ALTER TABLE "Position"
  ALTER COLUMN "sourceProvider" TYPE "PositionSourceProvider"
    USING ("sourceProvider"::text::"PositionSourceProvider");
ALTER TABLE "Position" ALTER COLUMN "sourceProvider" SET DEFAULT 'INTERNAL';

DROP TYPE "PositionSourceProvider_old";
