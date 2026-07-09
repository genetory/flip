-- CreateTable
CREATE TABLE "CareerLaunchProgress" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "state" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerLaunchProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CareerLaunchProgress_studentUserId_key" ON "CareerLaunchProgress"("studentUserId");

-- AddForeignKey
ALTER TABLE "CareerLaunchProgress" ADD CONSTRAINT "CareerLaunchProgress_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

