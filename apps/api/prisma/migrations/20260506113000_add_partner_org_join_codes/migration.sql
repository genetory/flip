-- CreateTable
CREATE TABLE "PartnerOrganizationJoinCode" (
    "id" TEXT NOT NULL,
    "partnerOrganizationId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerOrganizationJoinCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartnerOrganizationJoinCode_codeHash_key" ON "PartnerOrganizationJoinCode"("codeHash");

-- CreateIndex
CREATE INDEX "PartnerOrganizationJoinCode_partnerOrganizationId_idx" ON "PartnerOrganizationJoinCode"("partnerOrganizationId");

-- CreateIndex
CREATE INDEX "PartnerOrganizationJoinCode_createdByUserId_idx" ON "PartnerOrganizationJoinCode"("createdByUserId");

-- CreateIndex
CREATE INDEX "PartnerOrganizationJoinCode_expiresAt_idx" ON "PartnerOrganizationJoinCode"("expiresAt");

-- CreateIndex
CREATE INDEX "PartnerOrganizationJoinCode_usedAt_idx" ON "PartnerOrganizationJoinCode"("usedAt");

-- AddForeignKey
ALTER TABLE "PartnerOrganizationJoinCode"
ADD CONSTRAINT "PartnerOrganizationJoinCode_partnerOrganizationId_fkey"
FOREIGN KEY ("partnerOrganizationId")
REFERENCES "PartnerOrganization"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerOrganizationJoinCode"
ADD CONSTRAINT "PartnerOrganizationJoinCode_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId")
REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
