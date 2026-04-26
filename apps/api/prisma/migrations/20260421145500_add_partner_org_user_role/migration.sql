CREATE TYPE "PartnerOrgUserRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

ALTER TABLE "User"
ADD COLUMN "partnerOrgRole" "PartnerOrgUserRole";

CREATE INDEX "User_partnerOrgRole_idx" ON "User"("partnerOrgRole");
