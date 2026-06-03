-- Capture signup-time client metadata so ops can trace bot/spam waves
-- (chameleon-group / disposable-domain bursts etc.) without standing up a
-- separate audit table. All nullable — backfill not needed; rows created
-- before this migration legitimately have no forensic data.
ALTER TABLE "User"
  ADD COLUMN "signupIp" TEXT,
  ADD COLUMN "signupUserAgent" TEXT,
  ADD COLUMN "signupReferer" TEXT;
