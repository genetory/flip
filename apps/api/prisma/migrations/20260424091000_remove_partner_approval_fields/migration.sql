DROP INDEX IF EXISTS "PartnerOrganization_approvalStatus_idx";

ALTER TABLE "PartnerOrganization"
  DROP COLUMN IF EXISTS "approvalStatus",
  DROP COLUMN IF EXISTS "approvedAt";

DROP TYPE IF EXISTS "PartnerApprovalStatus";
