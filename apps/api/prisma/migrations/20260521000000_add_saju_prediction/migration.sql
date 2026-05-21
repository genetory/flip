CREATE TABLE "SajuPrediction" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "birthTime" TEXT,
    "calendarType" TEXT NOT NULL DEFAULT 'solar',
    "interpretation" TEXT NOT NULL,
    "recommendedRoleNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recommendedPositionIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "shareSlug" TEXT NOT NULL,
    "userId" TEXT,
    "ipHash" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'ko',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),

    CONSTRAINT "SajuPrediction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SajuPrediction_shareSlug_key" ON "SajuPrediction"("shareSlug");
CREATE INDEX "SajuPrediction_userId_idx" ON "SajuPrediction"("userId");
CREATE INDEX "SajuPrediction_createdAt_idx" ON "SajuPrediction"("createdAt");
