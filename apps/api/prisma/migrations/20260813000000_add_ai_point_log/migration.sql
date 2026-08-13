-- CreateTable
CREATE TABLE "AiPointLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiPointLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiPointLog_userId_createdAt_idx" ON "AiPointLog"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "AiPointLog" ADD CONSTRAINT "AiPointLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
