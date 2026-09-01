-- Phase 11 대학·기관 B2B 운영 확장 — additive. 기존 테이블/컬럼/데이터 무변경.

-- CareerCohort 기관 연결(nullable → 기존 기수 무영향, backfill 로 채움).
ALTER TABLE "CareerCohort" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "CareerCohort" ADD COLUMN "templateId" TEXT;
CREATE INDEX "CareerCohort_organizationId_idx" ON "CareerCohort"("organizationId");

-- 기관.
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'prospect',
    "slug" TEXT,
    "primaryContact" TEXT,
    "contactEmail" TEXT,
    "timezone" TEXT DEFAULT 'Asia/Seoul',
    "locale" TEXT DEFAULT 'ko',
    "configuration" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX "Organization_status_idx" ON "Organization"("status");
CREATE INDEX "Organization_type_idx" ON "Organization"("type");

-- 기관 멤버십.
CREATE TABLE "OrganizationMembership" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrganizationMembership_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "OrganizationMembership_organizationId_userId_role_key" ON "OrganizationMembership"("organizationId", "userId", "role");
CREATE INDEX "OrganizationMembership_userId_idx" ON "OrganizationMembership"("userId");
CREATE INDEX "OrganizationMembership_organizationId_role_idx" ON "OrganizationMembership"("organizationId", "role");
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 프로그램 템플릿.
CREATE TABLE "CareerProgramTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "programVersion" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "configuration" JSONB NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CareerProgramTemplate_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CareerProgramTemplate_status_idx" ON "CareerProgramTemplate"("status");

-- 기수 템플릿 스냅샷.
CREATE TABLE "CareerCohortTemplateSnapshot" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "templateId" TEXT,
    "templateVersion" INTEGER,
    "configuration" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CareerCohortTemplateSnapshot_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CareerCohortTemplateSnapshot_cohortId_key" ON "CareerCohortTemplateSnapshot"("cohortId");
CREATE INDEX "CareerCohortTemplateSnapshot_templateId_idx" ON "CareerCohortTemplateSnapshot"("templateId");
ALTER TABLE "CareerCohortTemplateSnapshot" ADD CONSTRAINT "CareerCohortTemplateSnapshot_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CareerProgramTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 라이선스/좌석.
CREATE TABLE "OrganizationLicense" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "contractedSeats" INTEGER,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "overagePolicy" TEXT DEFAULT 'block',
    "configuration" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrganizationLicense_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OrganizationLicense_organizationId_idx" ON "OrganizationLicense"("organizationId");
ALTER TABLE "OrganizationLicense" ADD CONSTRAINT "OrganizationLicense_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 강사·상담자 배정.
CREATE TABLE "CareerStaffAssignment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "cohortId" TEXT,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CareerStaffAssignment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CareerStaffAssignment_organizationId_idx" ON "CareerStaffAssignment"("organizationId");
CREATE INDEX "CareerStaffAssignment_cohortId_idx" ON "CareerStaffAssignment"("cohortId");
CREATE INDEX "CareerStaffAssignment_userId_idx" ON "CareerStaffAssignment"("userId");
ALTER TABLE "CareerStaffAssignment" ADD CONSTRAINT "CareerStaffAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 기관 성과 리포트 스냅샷.
CREATE TABLE "CareerOrganizationReport" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "cohortId" TEXT,
    "reportType" TEXT NOT NULL,
    "metricVersion" TEXT NOT NULL,
    "snapshotData" JSONB NOT NULL,
    "generatedBy" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CareerOrganizationReport_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CareerOrganizationReport_organizationId_cohortId_idx" ON "CareerOrganizationReport"("organizationId", "cohortId");
ALTER TABLE "CareerOrganizationReport" ADD CONSTRAINT "CareerOrganizationReport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 기관 감사 로그.
CREATE TABLE "OrganizationAuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "actorId" TEXT,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "changeData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrganizationAuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OrganizationAuditLog_organizationId_createdAt_idx" ON "OrganizationAuditLog"("organizationId", "createdAt");
CREATE INDEX "OrganizationAuditLog_action_idx" ON "OrganizationAuditLog"("action");
ALTER TABLE "OrganizationAuditLog" ADD CONSTRAINT "OrganizationAuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
