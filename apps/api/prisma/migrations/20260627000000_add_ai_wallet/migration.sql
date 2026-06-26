-- 공용 AI 티켓 지갑(잔액). 가입 시 1회 보너스 + 매일 일정량 적립(상한)하고, 사용 시 차감한다.
-- userId 당 1개(잔액 원장). 적립 계산은 애플리케이션에서 KST epoch-day 인덱스로 처리.

-- CreateTable
CREATE TABLE "AiWallet" (
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "lastGrantDay" INTEGER NOT NULL DEFAULT 0,
    "welcomed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiWallet_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "AiWallet" ADD CONSTRAINT "AiWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
