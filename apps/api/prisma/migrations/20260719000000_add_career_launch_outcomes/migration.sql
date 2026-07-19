-- CreateEnum
CREATE TYPE "EmploymentOutcomeStatus" AS ENUM ('APPLIED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED');

-- CreateTable
CREATE TABLE "CareerEmploymentOutcome" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "cohortId" TEXT,
    "status" "EmploymentOutcomeStatus" NOT NULL DEFAULT 'APPLIED',
    "companyName" TEXT NOT NULL,
    "positionTitle" TEXT,
    "source" TEXT,
    "positionId" TEXT,
    "note" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerEmploymentOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerLaunchSatisfaction" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "npsScore" INTEGER,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerLaunchSatisfaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerLaunchCertificate" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "certificateNo" TEXT NOT NULL,
    "issuedByUserId" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerLaunchCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CareerEmploymentOutcome_studentUserId_idx" ON "CareerEmploymentOutcome"("studentUserId");

-- CreateIndex
CREATE INDEX "CareerEmploymentOutcome_cohortId_idx" ON "CareerEmploymentOutcome"("cohortId");

-- CreateIndex
CREATE INDEX "CareerEmploymentOutcome_status_idx" ON "CareerEmploymentOutcome"("status");

-- CreateIndex
CREATE INDEX "CareerLaunchSatisfaction_cohortId_idx" ON "CareerLaunchSatisfaction"("cohortId");

-- CreateIndex
CREATE UNIQUE INDEX "CareerLaunchSatisfaction_cohortId_studentUserId_key" ON "CareerLaunchSatisfaction"("cohortId", "studentUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CareerLaunchCertificate_certificateNo_key" ON "CareerLaunchCertificate"("certificateNo");

-- CreateIndex
CREATE INDEX "CareerLaunchCertificate_cohortId_idx" ON "CareerLaunchCertificate"("cohortId");

-- CreateIndex
CREATE UNIQUE INDEX "CareerLaunchCertificate_cohortId_studentUserId_key" ON "CareerLaunchCertificate"("cohortId", "studentUserId");

-- AddForeignKey
ALTER TABLE "CareerEmploymentOutcome" ADD CONSTRAINT "CareerEmploymentOutcome_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerEmploymentOutcome" ADD CONSTRAINT "CareerEmploymentOutcome_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "CareerCohort"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerLaunchSatisfaction" ADD CONSTRAINT "CareerLaunchSatisfaction_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerLaunchSatisfaction" ADD CONSTRAINT "CareerLaunchSatisfaction_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "CareerCohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerLaunchCertificate" ADD CONSTRAINT "CareerLaunchCertificate_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerLaunchCertificate" ADD CONSTRAINT "CareerLaunchCertificate_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "CareerCohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerLaunchCertificate" ADD CONSTRAINT "CareerLaunchCertificate_issuedByUserId_fkey" FOREIGN KEY ("issuedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

