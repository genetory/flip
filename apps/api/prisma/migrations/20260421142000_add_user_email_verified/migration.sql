-- Add email verification status for users
ALTER TABLE "User"
ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "User_emailVerified_idx" ON "User"("emailVerified");
