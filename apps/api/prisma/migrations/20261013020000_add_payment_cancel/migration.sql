-- 결제 환불(취소) 기록.
ALTER TABLE "PaymentOrder" ADD COLUMN IF NOT EXISTS "canceledAt" TIMESTAMP(3);
ALTER TABLE "PaymentOrder" ADD COLUMN IF NOT EXISTS "canceledAmount" INTEGER;
ALTER TABLE "PaymentOrder" ADD COLUMN IF NOT EXISTS "cancelReason" TEXT;
