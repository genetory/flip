ALTER TABLE "User"
ADD COLUMN "nationality" TEXT,
ADD COLUMN "affiliation" TEXT;

CREATE INDEX "User_affiliation_idx" ON "User"("affiliation");
