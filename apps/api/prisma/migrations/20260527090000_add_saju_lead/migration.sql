-- CreateTable
CREATE TABLE "SajuLead" (
    "id" TEXT NOT NULL,
    "predictionId" TEXT,
    "shareSlug" TEXT,
    "name" TEXT,
    "nationality" TEXT,
    "school" TEXT,
    "major" TEXT,
    "visaType" TEXT,
    "koreanLevel" TEXT,
    "englishLevel" TEXT,
    "preferredJobRole" TEXT,
    "workType" TEXT,
    "contact" TEXT,
    "contactType" TEXT,
    "hasResume" BOOLEAN,
    "recommendedRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "improvements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recommendStatus" TEXT,
    "poolStage" TEXT NOT NULL DEFAULT 'PROFILE',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "consentCareer" BOOLEAN NOT NULL DEFAULT false,
    "consentRecommend" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'ko',
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SajuLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SajuLead_predictionId_idx" ON "SajuLead"("predictionId");

-- CreateIndex
CREATE INDEX "SajuLead_userId_idx" ON "SajuLead"("userId");

-- CreateIndex
CREATE INDEX "SajuLead_poolStage_idx" ON "SajuLead"("poolStage");

-- CreateIndex
CREATE INDEX "SajuLead_createdAt_idx" ON "SajuLead"("createdAt");

-- AddForeignKey
ALTER TABLE "SajuLead" ADD CONSTRAINT "SajuLead_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "SajuPrediction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
