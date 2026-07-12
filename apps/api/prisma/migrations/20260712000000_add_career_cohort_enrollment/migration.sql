-- CreateTable
CREATE TABLE "CareerCohort" (
    "id" TEXT NOT NULL,
    "university" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerCohort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerEnrollment" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CareerCohort_inviteCode_key" ON "CareerCohort"("inviteCode");

-- CreateIndex
CREATE INDEX "CareerCohort_status_idx" ON "CareerCohort"("status");

-- CreateIndex
CREATE INDEX "CareerEnrollment_studentUserId_idx" ON "CareerEnrollment"("studentUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CareerEnrollment_cohortId_studentUserId_key" ON "CareerEnrollment"("cohortId", "studentUserId");

-- AddForeignKey
ALTER TABLE "CareerEnrollment" ADD CONSTRAINT "CareerEnrollment_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "CareerCohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerEnrollment" ADD CONSTRAINT "CareerEnrollment_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

