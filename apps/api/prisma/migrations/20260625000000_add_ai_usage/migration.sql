-- AI 프리미엄 월 한도(공용 티켓) 사용량. 공고 맞춤 분석·모의 면접 시작 등
-- 티켓을 쓰는 기능의 (userId, feature, periodKey) 당 카운트를 KST 월 단위로 기록한다.

-- CreateTable
CREATE TABLE "AiUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiUsage_userId_idx" ON "AiUsage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AiUsage_userId_feature_periodKey_key" ON "AiUsage"("userId", "feature", "periodKey");

-- AddForeignKey
ALTER TABLE "AiUsage" ADD CONSTRAINT "AiUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
