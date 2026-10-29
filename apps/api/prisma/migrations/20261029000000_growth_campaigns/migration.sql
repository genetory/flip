-- 그로스 캠페인(운영자가 학생 묶음에 보낸 알림) + 받은 사람
CREATE TABLE IF NOT EXISTS "GrowthCampaign" (
  "id" TEXT NOT NULL,
  "segment" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "linkPath" TEXT,
  "email" BOOLEAN NOT NULL DEFAULT false,
  "points" INTEGER NOT NULL DEFAULT 0,
  "sentCount" INTEGER NOT NULL DEFAULT 0,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GrowthCampaign_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "GrowthCampaign_createdAt_idx" ON "GrowthCampaign"("createdAt");

CREATE TABLE IF NOT EXISTS "GrowthCampaignRecipient" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GrowthCampaignRecipient_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "GrowthCampaignRecipient_campaignId_userId_key" ON "GrowthCampaignRecipient"("campaignId", "userId");
CREATE INDEX IF NOT EXISTS "GrowthCampaignRecipient_userId_idx" ON "GrowthCampaignRecipient"("userId");
DO $$ BEGIN
  ALTER TABLE "GrowthCampaignRecipient" ADD CONSTRAINT "GrowthCampaignRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "GrowthCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "GrowthCampaignRecipient" ADD CONSTRAINT "GrowthCampaignRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
