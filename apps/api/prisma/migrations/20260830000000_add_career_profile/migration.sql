-- 공통 Career Profile(Phase 2) — additive. 기존 테이블/컬럼/데이터 무변경.

-- CreateTable
CREATE TABLE "CareerProfile" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "revision" INTEGER NOT NULL DEFAULT 0,
    "mergedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerProfileEvent" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "itemKey" TEXT,
    "action" TEXT NOT NULL,
    "status" TEXT,
    "source" TEXT,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerProfileEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CareerProfile_studentUserId_key" ON "CareerProfile"("studentUserId");

-- CreateIndex
CREATE INDEX "CareerProfileEvent_studentUserId_createdAt_idx" ON "CareerProfileEvent"("studentUserId", "createdAt");

-- CreateIndex
CREATE INDEX "CareerProfileEvent_studentUserId_area_idx" ON "CareerProfileEvent"("studentUserId", "area");

-- AddForeignKey
ALTER TABLE "CareerProfile" ADD CONSTRAINT "CareerProfile_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerProfileEvent" ADD CONSTRAINT "CareerProfileEvent_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
