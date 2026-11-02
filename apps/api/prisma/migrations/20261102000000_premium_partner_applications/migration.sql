-- APLY PARTNERS 기업 제휴 문의 + 사전 수요조사(/premium-partners)
CREATE TABLE IF NOT EXISTS "PremiumPartnerApplication" (
  "id" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "contactName" TEXT NOT NULL,
  "contactTitle" TEXT,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "website" TEXT,
  "companySize" TEXT NOT NULL,
  "industry" TEXT,
  "partnershipModels" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "hiringPlan" TEXT NOT NULL,
  "roles" TEXT NOT NULL,
  "headcount" TEXT NOT NULL,
  "duration" TEXT NOT NULL,
  "workConditions" TEXT,
  "foreignHiring" TEXT NOT NULL,
  "conversion" TEXT NOT NULL,
  "message" TEXT,
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
  CONSTRAINT "PremiumPartnerApplication_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PremiumPartnerApplication_email_idx" ON "PremiumPartnerApplication"("email");
CREATE INDEX IF NOT EXISTS "PremiumPartnerApplication_status_idx" ON "PremiumPartnerApplication"("status");
CREATE INDEX IF NOT EXISTS "PremiumPartnerApplication_hiringPlan_idx" ON "PremiumPartnerApplication"("hiringPlan");
CREATE INDEX IF NOT EXISTS "PremiumPartnerApplication_createdAt_idx" ON "PremiumPartnerApplication"("createdAt");
