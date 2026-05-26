-- DropIndex
DROP INDEX "Position_embedding_hnsw_idx";

-- DropIndex
DROP INDEX "Position_sourceDeadlineDate_idx";

-- DropIndex
DROP INDEX "Position_status_provider_role_idx";

-- AlterTable
ALTER TABLE "SajuPrediction" ALTER COLUMN "recommendedRoleNames" DROP DEFAULT,
ALTER COLUMN "recommendedPositionIds" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Resume" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Resume_userId_idx" ON "Resume"("userId");

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
