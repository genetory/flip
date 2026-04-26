CREATE TYPE "PartnerCompanySize" AS ENUM (
  'SIZE_1_10',
  'SIZE_UNDER_30',
  'SIZE_UNDER_50',
  'SIZE_OVER_100'
);

ALTER TABLE "PartnerOrganization"
ADD COLUMN "companySize" "PartnerCompanySize",
ADD COLUMN "adminMemo" TEXT;

CREATE INDEX "PartnerOrganization_companySize_idx" ON "PartnerOrganization"("companySize");

