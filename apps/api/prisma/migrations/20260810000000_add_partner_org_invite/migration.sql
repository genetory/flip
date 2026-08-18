-- 이메일 팀원 초대 — 관리자가 이메일로 초대하면 토큰 링크가 발송되고,
-- 초대받은 사람이 링크에서 이메일을 확인하면 회사에 합류한다.
-- 멱등 처리(IF NOT EXISTS / DO 블록): 기존 마이그레이션 이력이 완전히 깨끗하지
-- 않아, 대상 DB에 객체가 일부 존재하더라도 안전하게 적용되도록 방어한다.

DO $$ BEGIN
  CREATE TYPE "PartnerInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "PartnerOrganizationInvite" (
    "id" TEXT NOT NULL,
    "partnerOrganizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "partnerOrgRole" "PartnerOrgUserRole" NOT NULL DEFAULT 'MEMBER',
    "invitedByUserId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "PartnerInviteStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "acceptedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PartnerOrganizationInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PartnerOrganizationInvite_tokenHash_key" ON "PartnerOrganizationInvite"("tokenHash");
CREATE INDEX IF NOT EXISTS "PartnerOrganizationInvite_partnerOrganizationId_idx" ON "PartnerOrganizationInvite"("partnerOrganizationId");
CREATE INDEX IF NOT EXISTS "PartnerOrganizationInvite_email_idx" ON "PartnerOrganizationInvite"("email");
CREATE INDEX IF NOT EXISTS "PartnerOrganizationInvite_status_idx" ON "PartnerOrganizationInvite"("status");
