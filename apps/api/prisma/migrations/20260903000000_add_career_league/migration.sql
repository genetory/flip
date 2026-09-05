-- Phase 7 경쟁·리그·개입(Phase 7) — additive. 기존 테이블/컬럼/데이터 무변경.

CREATE TABLE "CareerLeague" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "jobFamilyKey" TEXT,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "minMembers" INTEGER NOT NULL DEFAULT 10,
    "maxMembers" INTEGER NOT NULL DEFAULT 20,
    "scoringVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CareerLeague_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CareerLeagueMember" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    CONSTRAINT "CareerLeagueMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CareerLeagueScore" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "cohortId" TEXT,
    "leagueId" TEXT,
    "scoringVersion" TEXT NOT NULL,
    "missionScore" INTEGER NOT NULL DEFAULT 0,
    "artifactScore" INTEGER NOT NULL DEFAULT 0,
    "growthScore" INTEGER NOT NULL DEFAULT 0,
    "practiceScore" INTEGER NOT NULL DEFAULT 0,
    "correctionScore" INTEGER NOT NULL DEFAULT 0,
    "contributionScore" INTEGER NOT NULL DEFAULT 0,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "percentile" INTEGER,
    "previousRank" INTEGER,
    "rankDelta" INTEGER,
    "sourceSnapshot" JSONB,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CareerLeagueScore_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CareerLeagueSnapshot" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "scoringVersion" TEXT,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rankingData" JSONB NOT NULL DEFAULT '[]',
    "aggregateData" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CareerLeagueSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CareerAchievement" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "enrollmentId" TEXT,
    "badgeKey" TEXT NOT NULL,
    "criteriaVersion" TEXT,
    "sourceData" JSONB,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CareerAchievement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CareerCohortGoal" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "goalType" TEXT NOT NULL,
    "targetValue" INTEGER NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "configuration" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CareerCohortGoal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CareerIntervention" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "enrollmentId" TEXT,
    "cohortId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "reasonCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "evidence" JSONB,
    "aiSummary" JSONB,
    "assignedAdminId" TEXT,
    "nextReviewAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CareerIntervention_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CareerInterventionLog" (
    "id" TEXT NOT NULL,
    "interventionId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "previousStatus" TEXT,
    "nextStatus" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CareerInterventionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CareerLeague_cohortId_type_idx" ON "CareerLeague"("cohortId", "type");
CREATE UNIQUE INDEX "CareerLeagueMember_leagueId_enrollmentId_key" ON "CareerLeagueMember"("leagueId", "enrollmentId");
CREATE INDEX "CareerLeagueMember_studentUserId_idx" ON "CareerLeagueMember"("studentUserId");
CREATE UNIQUE INDEX "CareerLeagueScore_studentUserId_leagueId_key" ON "CareerLeagueScore"("studentUserId", "leagueId");
CREATE INDEX "CareerLeagueScore_leagueId_idx" ON "CareerLeagueScore"("leagueId");
CREATE INDEX "CareerLeagueSnapshot_leagueId_snapshotAt_idx" ON "CareerLeagueSnapshot"("leagueId", "snapshotAt");
CREATE UNIQUE INDEX "CareerAchievement_studentUserId_badgeKey_key" ON "CareerAchievement"("studentUserId", "badgeKey");
CREATE INDEX "CareerAchievement_studentUserId_idx" ON "CareerAchievement"("studentUserId");
CREATE INDEX "CareerCohortGoal_cohortId_idx" ON "CareerCohortGoal"("cohortId");
CREATE INDEX "CareerIntervention_cohortId_priority_idx" ON "CareerIntervention"("cohortId", "priority");
CREATE INDEX "CareerIntervention_studentUserId_idx" ON "CareerIntervention"("studentUserId");
CREATE INDEX "CareerInterventionLog_interventionId_idx" ON "CareerInterventionLog"("interventionId");

-- AddForeignKey
ALTER TABLE "CareerLeagueScore" ADD CONSTRAINT "CareerLeagueScore_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareerAchievement" ADD CONSTRAINT "CareerAchievement_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareerIntervention" ADD CONSTRAINT "CareerIntervention_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
