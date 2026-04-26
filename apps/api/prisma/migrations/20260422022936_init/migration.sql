/*
  Warnings:

  - You are about to drop the column `matchingParticipants` on the `Position` table. All the data in the column will be lost.
  - You are about to drop the column `postingProgressLogs` on the `Position` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Position" DROP COLUMN "matchingParticipants",
DROP COLUMN "postingProgressLogs",
ALTER COLUMN "preferredNationalities" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "communicationLanguages" SET DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "PositionMatchingParticipant" (
    "id" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PositionMatchingParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PositionProgressLog" (
    "id" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PositionProgressLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PositionStatusHistory" (
    "id" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "fromStatus" "PositionStatus",
    "toStatus" "PositionStatus" NOT NULL,
    "note" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PositionStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PositionMatchingParticipant_positionId_idx" ON "PositionMatchingParticipant"("positionId");

-- CreateIndex
CREATE INDEX "PositionMatchingParticipant_createdAt_idx" ON "PositionMatchingParticipant"("createdAt");

-- CreateIndex
CREATE INDEX "PositionProgressLog_positionId_idx" ON "PositionProgressLog"("positionId");

-- CreateIndex
CREATE INDEX "PositionProgressLog_createdAt_idx" ON "PositionProgressLog"("createdAt");

-- CreateIndex
CREATE INDEX "PositionStatusHistory_positionId_idx" ON "PositionStatusHistory"("positionId");

-- CreateIndex
CREATE INDEX "PositionStatusHistory_createdAt_idx" ON "PositionStatusHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "PositionMatchingParticipant" ADD CONSTRAINT "PositionMatchingParticipant_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionMatchingParticipant" ADD CONSTRAINT "PositionMatchingParticipant_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionProgressLog" ADD CONSTRAINT "PositionProgressLog_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionProgressLog" ADD CONSTRAINT "PositionProgressLog_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionStatusHistory" ADD CONSTRAINT "PositionStatusHistory_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionStatusHistory" ADD CONSTRAINT "PositionStatusHistory_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
