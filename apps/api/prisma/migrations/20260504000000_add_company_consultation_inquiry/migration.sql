-- CreateTable
CREATE TABLE "CompanyConsultationInquiry" (
  "id" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "contactName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "message" TEXT NOT NULL,
  "locale" TEXT NOT NULL DEFAULT 'ko',
  "source" TEXT NOT NULL DEFAULT 'platform-web',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CompanyConsultationInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyConsultationInquiry_createdAt_idx" ON "CompanyConsultationInquiry"("createdAt");
CREATE INDEX "CompanyConsultationInquiry_email_idx" ON "CompanyConsultationInquiry"("email");
