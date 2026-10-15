-- "내 경험이 스펙이 되는 순간" 자소서 경험 발굴 캠페인 신청 — additive. 기존 테이블/컬럼/데이터 무변경.

CREATE TABLE "ExperienceCampaignApplication" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "nationality" TEXT,
    "desiredRole" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "coverLetter" TEXT,
    "consultMethod" TEXT NOT NULL,
    "consentPrivacyAt" TIMESTAMP(3) NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "consentCaseStudy" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "opsNote" TEXT,
    "selectedWeek" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "referrer" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'ko',
    "userId" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperienceCampaignApplication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ExperienceCampaignApplication_email_idx" ON "ExperienceCampaignApplication"("email");
CREATE INDEX "ExperienceCampaignApplication_status_idx" ON "ExperienceCampaignApplication"("status");
CREATE INDEX "ExperienceCampaignApplication_createdAt_idx" ON "ExperienceCampaignApplication"("createdAt");
