-- CreateEnum
CREATE TYPE "PositionSourceKind" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "PositionSourceProvider" AS ENUM ('INTERNAL', 'BUDDIES', 'OTHER');

-- AlterTable
ALTER TABLE "Position"
ADD COLUMN "sourceKind" "PositionSourceKind" NOT NULL DEFAULT 'INTERNAL',
ADD COLUMN "sourceProvider" "PositionSourceProvider" NOT NULL DEFAULT 'INTERNAL',
ADD COLUMN "sourceExternalId" TEXT,
ADD COLUMN "sourceUrl" TEXT,
ADD COLUMN "sourceFetchedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Position_sourceKind_sourceProvider_idx" ON "Position"("sourceKind", "sourceProvider");

-- CreateIndex
CREATE UNIQUE INDEX "Position_sourceProvider_sourceExternalId_key" ON "Position"("sourceProvider", "sourceExternalId");
