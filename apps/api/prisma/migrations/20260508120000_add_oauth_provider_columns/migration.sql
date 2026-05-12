-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('EMAIL', 'NAVER', 'KAKAO', 'GOOGLE');

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable: passwordHash nullable, add authProvider/providerId
ALTER TABLE "User"
  ALTER COLUMN "passwordHash" DROP NOT NULL,
  ADD COLUMN "authProvider" "AuthProvider" NOT NULL DEFAULT 'EMAIL',
  ADD COLUMN "providerId" TEXT;

-- CreateIndex: composite uniques + provider index
CREATE UNIQUE INDEX "User_email_authProvider_key" ON "User"("email", "authProvider");
CREATE UNIQUE INDEX "User_authProvider_providerId_key" ON "User"("authProvider", "providerId");
CREATE INDEX "User_authProvider_idx" ON "User"("authProvider");
