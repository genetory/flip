-- 운영자 일괄 등록 학생의 원본 이력서 파일(PDF·Word) — 운영팀만 본다(기업 화면에는 내보내지 않음, 연락처가 들어 있어서).
-- 파일은 스토리지에, 여기엔 이름·위치만. additive: 새 테이블 하나.

CREATE TABLE "StudentSourceFile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "blobName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'application/octet-stream',
    "size" INTEGER NOT NULL DEFAULT 0,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentSourceFile_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StudentSourceFile_userId_idx" ON "StudentSourceFile"("userId");

ALTER TABLE "StudentSourceFile" ADD CONSTRAINT "StudentSourceFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
