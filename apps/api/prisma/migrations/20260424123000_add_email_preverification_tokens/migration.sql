CREATE TABLE "EmailPreverificationToken" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "verifiedAt" TIMESTAMP(3),
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailPreverificationToken_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmailPreverificationToken_email_idx" ON "EmailPreverificationToken"("email");
CREATE INDEX "EmailPreverificationToken_expiresAt_idx" ON "EmailPreverificationToken"("expiresAt");
CREATE INDEX "EmailPreverificationToken_verifiedAt_idx" ON "EmailPreverificationToken"("verifiedAt");
CREATE INDEX "EmailPreverificationToken_usedAt_idx" ON "EmailPreverificationToken"("usedAt");
