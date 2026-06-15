-- CreateTable
CREATE TABLE IF NOT EXISTS "HanpassSurveyResponse" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "jobIntent" TEXT NOT NULL,
    "availableFrom" TEXT NOT NULL,
    "jobFields" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "jobFieldOther" TEXT,
    "visaType" TEXT NOT NULL,
    "wantsConsulting" TEXT NOT NULL,
    "consultLanguages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "privacyConsent" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT NOT NULL DEFAULT 'ko',
    "source" TEXT NOT NULL DEFAULT 'hanpass',
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HanpassSurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "HanpassSurveyResponse_createdAt_idx" ON "HanpassSurveyResponse"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "HanpassSurveyResponse_email_idx" ON "HanpassSurveyResponse"("email");
