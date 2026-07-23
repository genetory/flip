-- AlterTable
ALTER TABLE "Notification" ADD COLUMN "applicationId" TEXT;

-- CreateIndex
CREATE INDEX "Notification_userId_applicationId_readAt_idx" ON "Notification"("userId", "applicationId", "readAt");
