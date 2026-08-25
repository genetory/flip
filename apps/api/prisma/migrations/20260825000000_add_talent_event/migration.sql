-- CreateTable
CREATE TABLE "TalentEvent" (
    "id" TEXT NOT NULL,
    "talentUserId" TEXT NOT NULL,
    "actorType" TEXT NOT NULL DEFAULT 'talent',
    "eventType" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TalentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TalentEvent_talentUserId_createdAt_idx" ON "TalentEvent"("talentUserId", "createdAt");

-- CreateIndex
CREATE INDEX "TalentEvent_eventType_createdAt_idx" ON "TalentEvent"("eventType", "createdAt");

-- AddForeignKey
ALTER TABLE "TalentEvent" ADD CONSTRAINT "TalentEvent_talentUserId_fkey" FOREIGN KEY ("talentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
