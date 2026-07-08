-- CreateTable
CREATE TABLE "CareerLaunchFeedback" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "week" INTEGER,
    "docType" TEXT NOT NULL,
    "docId" TEXT,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerLaunchFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CareerLaunchFeedback_studentUserId_idx" ON "CareerLaunchFeedback"("studentUserId");

-- CreateIndex
CREATE INDEX "CareerLaunchFeedback_authorUserId_idx" ON "CareerLaunchFeedback"("authorUserId");

-- AddForeignKey
ALTER TABLE "CareerLaunchFeedback" ADD CONSTRAINT "CareerLaunchFeedback_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerLaunchFeedback" ADD CONSTRAINT "CareerLaunchFeedback_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

