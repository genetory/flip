CREATE TABLE "MatchingRunHistory" (
  "id" TEXT NOT NULL,
  "mode" TEXT NOT NULL,
  "source" TEXT,
  "positionId" TEXT,
  "candidateId" TEXT,
  "positionTitle" TEXT,
  "candidateLabel" TEXT,
  "resultCount" INTEGER NOT NULL DEFAULT 0,
  "results" JSONB NOT NULL,
  "ranAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MatchingRunHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MatchingRunHistory_createdAt_idx" ON "MatchingRunHistory"("createdAt");
CREATE INDEX "MatchingRunHistory_mode_idx" ON "MatchingRunHistory"("mode");
CREATE INDEX "MatchingRunHistory_positionId_idx" ON "MatchingRunHistory"("positionId");
CREATE INDEX "MatchingRunHistory_candidateId_idx" ON "MatchingRunHistory"("candidateId");
