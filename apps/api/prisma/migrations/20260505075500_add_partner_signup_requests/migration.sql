CREATE TABLE "PartnerSignupRequest" (
  "id" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "companyIndustry" TEXT NOT NULL,
  "companySize" TEXT NOT NULL,
  "requesterName" TEXT NOT NULL,
  "requesterEmail" TEXT NOT NULL,
  "requesterPhone" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "reviewedByUserId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PartnerSignupRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PartnerSignupRequest_status_idx" ON "PartnerSignupRequest"("status");
CREATE INDEX "PartnerSignupRequest_requesterEmail_idx" ON "PartnerSignupRequest"("requesterEmail");
CREATE INDEX "PartnerSignupRequest_createdAt_idx" ON "PartnerSignupRequest"("createdAt");
