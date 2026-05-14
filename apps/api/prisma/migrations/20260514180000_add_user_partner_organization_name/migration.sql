-- Capture the partner organization (company) name a partner declares at
-- signup time, before they actually create / join a PartnerOrganization.
-- Used to pre-fill the verification flow and surface the declared name in
-- ops review without forcing the partner to re-enter it.
ALTER TABLE "User" ADD COLUMN "partnerOrganizationName" TEXT;
