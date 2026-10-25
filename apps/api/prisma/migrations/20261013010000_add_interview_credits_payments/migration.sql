-- 모의 면접 이용권(지갑·원장)과 결제 주문(토스페이먼츠).
CREATE TABLE IF NOT EXISTS "InterviewWallet" (
    "userId" TEXT NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "trialGranted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InterviewWallet_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE IF NOT EXISTS "InterviewCreditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InterviewCreditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PaymentOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productKey" TEXT NOT NULL,
    "orderName" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "credits" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "paymentKey" TEXT,
    "method" TEXT,
    "approvedAt" TIMESTAMP(3),
    "failReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaymentOrder_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "InterviewCreditLog_userId_createdAt_idx" ON "InterviewCreditLog"("userId", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentOrder_paymentKey_key" ON "PaymentOrder"("paymentKey");
CREATE INDEX IF NOT EXISTS "PaymentOrder_userId_createdAt_idx" ON "PaymentOrder"("userId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "InterviewWallet" ADD CONSTRAINT "InterviewWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
