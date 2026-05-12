ALTER TABLE "PartnerOrganization"
  ADD COLUMN "verificationApproved" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "verificationApprovedAt" TIMESTAMP(3);
