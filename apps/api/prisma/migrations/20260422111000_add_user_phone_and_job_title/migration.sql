ALTER TABLE "User"
ADD COLUMN "phoneNumber" TEXT,
ADD COLUMN "jobTitle" TEXT;

CREATE INDEX "User_phoneNumber_idx" ON "User"("phoneNumber");

