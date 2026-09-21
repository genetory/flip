-- 이력서·자기소개서 버전 — additive. 기존 테이블/컬럼/데이터 무변경.
-- snapshot 이 null 인 행 = 편집 중인 문서의 구성(모듈 원본은 Resume.content 그대로).
-- snapshot 이 있는 행 = '새 버전으로 저장'한 읽기 전용 저장본(그 순간의 내용·구성 복사).

CREATE TABLE "DocVersion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "layout" JSONB NOT NULL DEFAULT '{}',
    "snapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocVersion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DocVersion_userId_kind_idx" ON "DocVersion"("userId", "kind");

CREATE INDEX "DocVersion_resumeId_idx" ON "DocVersion"("resumeId");

ALTER TABLE "DocVersion" ADD CONSTRAINT "DocVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DocVersion" ADD CONSTRAINT "DocVersion_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
