-- Simplify PositionStatus enum from 8 values to 6 values.
-- Mapping:
--   APPROVED -> OPEN
--   MATCHING -> OPEN

ALTER TYPE "PositionStatus" RENAME TO "PositionStatus_old";

CREATE TYPE "PositionStatus" AS ENUM (
  'DRAFT',
  'PENDING_REVIEW',
  'OPEN',
  'PAUSED',
  'CLOSED',
  'REJECTED'
);

UPDATE "Position"
SET "status" = 'OPEN'::"PositionStatus_old"
WHERE "status" IN ('APPROVED'::"PositionStatus_old", 'MATCHING'::"PositionStatus_old");

UPDATE "PositionStatusHistory"
SET "fromStatus" = 'OPEN'::"PositionStatus_old"
WHERE "fromStatus" IN ('APPROVED'::"PositionStatus_old", 'MATCHING'::"PositionStatus_old");

UPDATE "PositionStatusHistory"
SET "toStatus" = 'OPEN'::"PositionStatus_old"
WHERE "toStatus" IN ('APPROVED'::"PositionStatus_old", 'MATCHING'::"PositionStatus_old");

ALTER TABLE "Position"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "PositionStatus"
  USING ("status"::text::"PositionStatus"),
  ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"PositionStatus";

ALTER TABLE "PositionStatusHistory"
  ALTER COLUMN "fromStatus" TYPE "PositionStatus"
  USING (CASE WHEN "fromStatus" IS NULL THEN NULL ELSE "fromStatus"::text::"PositionStatus" END),
  ALTER COLUMN "toStatus" TYPE "PositionStatus"
  USING ("toStatus"::text::"PositionStatus");

DROP TYPE "PositionStatus_old";
