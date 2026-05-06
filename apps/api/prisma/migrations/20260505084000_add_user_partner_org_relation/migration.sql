ALTER TABLE "User"
  ADD COLUMN "partnerOrganizationId" TEXT;

CREATE INDEX "User_partnerOrganizationId_idx" ON "User"("partnerOrganizationId");

ALTER TABLE "User"
  ADD CONSTRAINT "User_partnerOrganizationId_fkey"
  FOREIGN KEY ("partnerOrganizationId") REFERENCES "PartnerOrganization"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: map existing partner users to organization by exact email-domain match.
UPDATE "User" u
SET "partnerOrganizationId" = p."id"
FROM "PartnerOrganization" p
WHERE u."role" = 'PARTNER'
  AND split_part(lower(u."email"), '@', 2) = lower(p."domain")
  AND u."partnerOrganizationId" IS NULL;
