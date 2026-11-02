-- APLY PREMIUM 얼리 액세스 신청(/premium)
CREATE TABLE IF NOT EXISTS "PremiumEarlyAccessApplication" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "nationality" TEXT NOT NULL,
  "degreeLevel" TEXT NOT NULL,
  "visaStatus" TEXT NOT NULL,
  "graduationPeriod" TEXT NOT NULL,
  "desiredRole" TEXT NOT NULL,
  "interestedPlan" TEXT NOT NULL,
  "phoneOrMessenger" TEXT,
  "careerChallenge" TEXT,
  "additionalRequests" TEXT,
  "privacyConsentAt" TIMESTAMP(3) NOT NULL,
  "consentVersion" TEXT NOT NULL,
  "marketingConsentAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "opsNote" TEXT,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "referrer" TEXT,
  "locale" TEXT NOT NULL DEFAULT 'ko',
  "userId" TEXT,
  "ipHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PremiumEarlyAccessApplication_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PremiumEarlyAccessApplication_email_key" ON "PremiumEarlyAccessApplication"("email");
CREATE INDEX IF NOT EXISTS "PremiumEarlyAccessApplication_status_idx" ON "PremiumEarlyAccessApplication"("status");
CREATE INDEX IF NOT EXISTS "PremiumEarlyAccessApplication_interestedPlan_idx" ON "PremiumEarlyAccessApplication"("interestedPlan");
CREATE INDEX IF NOT EXISTS "PremiumEarlyAccessApplication_visaStatus_idx" ON "PremiumEarlyAccessApplication"("visaStatus");
CREATE INDEX IF NOT EXISTS "PremiumEarlyAccessApplication_createdAt_idx" ON "PremiumEarlyAccessApplication"("createdAt");
