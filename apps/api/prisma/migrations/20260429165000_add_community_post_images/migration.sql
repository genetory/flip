-- AlterTable
ALTER TABLE "CommunityPost"
ADD COLUMN "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

UPDATE "CommunityPost" SET "imageUrls" = ARRAY[]::TEXT[] WHERE "imageUrls" IS NULL;

ALTER TABLE "CommunityPost"
ALTER COLUMN "imageUrls" SET NOT NULL;
