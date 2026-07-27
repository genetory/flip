-- CreateTable
CREATE TABLE "CareerCohortWeek" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "opensAt" TIMESTAMP(3),
    "forceOpen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerCohortWeek_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CareerCohortWeek_cohortId_idx" ON "CareerCohortWeek"("cohortId");

-- CreateIndex
CREATE UNIQUE INDEX "CareerCohortWeek_cohortId_week_key" ON "CareerCohortWeek"("cohortId", "week");

-- AddForeignKey
ALTER TABLE "CareerCohortWeek" ADD CONSTRAINT "CareerCohortWeek_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "CareerCohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;
