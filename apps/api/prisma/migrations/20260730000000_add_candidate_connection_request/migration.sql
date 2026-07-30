-- 파트너 인재 검색 → 연결 요청(동의 기반). 포지션 무관 콜드 연결.
CREATE TABLE "CandidateConnectionRequest" (
    "id" TEXT NOT NULL,
    "partnerUserId" TEXT NOT NULL,
    "partnerOrganizationId" TEXT,
    "candidateUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CandidateConnectionRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CandidateConnectionRequest_partnerUserId_candidateUserId_key" ON "CandidateConnectionRequest"("partnerUserId", "candidateUserId");
CREATE INDEX "CandidateConnectionRequest_candidateUserId_status_idx" ON "CandidateConnectionRequest"("candidateUserId", "status");
CREATE INDEX "CandidateConnectionRequest_partnerUserId_idx" ON "CandidateConnectionRequest"("partnerUserId");
ALTER TABLE "CandidateConnectionRequest" ADD CONSTRAINT "CandidateConnectionRequest_partnerUserId_fkey" FOREIGN KEY ("partnerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CandidateConnectionRequest" ADD CONSTRAINT "CandidateConnectionRequest_candidateUserId_fkey" FOREIGN KEY ("candidateUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
