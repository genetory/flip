-- CreateEnum
CREATE TYPE "PartnerIndustry" AS ENUM ('IT_SOFTWARE', 'FINANCE_FINTECH', 'MANUFACTURING', 'RETAIL_LOGISTICS', 'MARKETING_ADVERTISING', 'EDUCATION', 'HEALTHCARE', 'ENTERTAINMENT', 'CONSTRUCTION_REAL_ESTATE', 'OTHER');

-- CreateTable
CREATE TABLE "PartnerOrganization" (
    "id" TEXT NOT NULL,
    "partnerType" "PartnerType" NOT NULL,
    "domain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "officeAddress" TEXT,
    "website" TEXT,
    "socialMedia" TEXT,
    "industry" "PartnerIndustry" NOT NULL,
    "description" TEXT,
    "strengths" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartnerOrganization_domain_key" ON "PartnerOrganization"("domain");

-- CreateIndex
CREATE INDEX "PartnerOrganization_partnerType_idx" ON "PartnerOrganization"("partnerType");

-- CreateIndex
CREATE INDEX "PartnerOrganization_industry_idx" ON "PartnerOrganization"("industry");

-- CreateIndex
CREATE INDEX "PartnerOrganization_name_idx" ON "PartnerOrganization"("name");
