-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'INTERVIEW', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "candidateUserId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "memo" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationStatusHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL,
    "changedByUserId" TEXT,
    "memo" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Application_positionId_candidateUserId_key" ON "Application"("positionId", "candidateUserId");
CREATE INDEX "Application_positionId_idx" ON "Application"("positionId");
CREATE INDEX "Application_candidateUserId_idx" ON "Application"("candidateUserId");
CREATE INDEX "Application_status_idx" ON "Application"("status");

CREATE INDEX "ApplicationStatusHistory_applicationId_idx" ON "ApplicationStatusHistory"("applicationId");
CREATE INDEX "ApplicationStatusHistory_changedByUserId_idx" ON "ApplicationStatusHistory"("changedByUserId");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_candidateUserId_fkey" FOREIGN KEY ("candidateUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationStatusHistory" ADD CONSTRAINT "ApplicationStatusHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationStatusHistory" ADD CONSTRAINT "ApplicationStatusHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: copy existing appliedPositionIds → Application rows with status=SUBMITTED
INSERT INTO "Application" ("id", "positionId", "candidateUserId", "status", "submittedAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    unnested_pid,
    cp."userId",
    'SUBMITTED'::"ApplicationStatus",
    cp."createdAt",
    cp."updatedAt"
FROM "CandidateProfile" cp,
LATERAL unnest(cp."appliedPositionIds") AS unnested_pid
WHERE EXISTS (SELECT 1 FROM "Position" p WHERE p.id = unnested_pid)
ON CONFLICT ("positionId", "candidateUserId") DO NOTHING;
