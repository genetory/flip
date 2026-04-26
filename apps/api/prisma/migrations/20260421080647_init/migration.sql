/*
  Warnings:

  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('STUDENT', 'PARTNER', 'OPERATOR');

-- CreateEnum
CREATE TYPE "PartnerType" AS ENUM ('UNIVERSITY', 'COMPANY', 'AGENCY');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "partnerType" "PartnerType",
DROP COLUMN "role",
ADD COLUMN     "role" "MemberRole" NOT NULL DEFAULT 'STUDENT';

-- DropEnum
DROP TYPE "UserRole";

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_partnerType_idx" ON "User"("partnerType");
