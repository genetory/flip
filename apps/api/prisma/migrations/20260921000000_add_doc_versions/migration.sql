-- 이력서·자기소개서 버전(용도별 구성) — additive. 기존 테이블/컬럼/데이터 무변경.
-- 모듈 내용의 원본은 Resume.content(talent 문서)에 그대로 두고, 여기엔 구성·배치·버전별 수정본만 둔다.

CREATE TABLE "DocVersion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "layout" JSONB NOT NULL DEFAULT '{}',
    "overrides" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocVersion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DocVersion_userId_kind_idx" ON "DocVersion"("userId", "kind");

CREATE INDEX "DocVersion_resumeId_idx" ON "DocVersion"("resumeId");

ALTER TABLE "DocVersion" ADD CONSTRAINT "DocVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DocVersion" ADD CONSTRAINT "DocVersion_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
