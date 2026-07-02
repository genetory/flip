-- 자기소개서 공개 공유 slug — 이력서와 동일. 기존 행은 'cl_' + id 로 backfill 후
-- NOT NULL + unique 부여(신규 행은 앱에서 cuid 생성).
ALTER TABLE "CoverLetter" ADD COLUMN "shareSlug" TEXT;
UPDATE "CoverLetter" SET "shareSlug" = 'cl_' || "id" WHERE "shareSlug" IS NULL;
ALTER TABLE "CoverLetter" ALTER COLUMN "shareSlug" SET NOT NULL;
CREATE UNIQUE INDEX "CoverLetter_shareSlug_key" ON "CoverLetter"("shareSlug");
