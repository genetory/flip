-- CreateTable
CREATE TABLE "CareerSeminar" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "title" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "online" BOOLEAN NOT NULL DEFAULT false,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerSeminar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CareerSeminar_cohortId_idx" ON "CareerSeminar"("cohortId");

-- CreateIndex
CREATE UNIQUE INDEX "CareerSeminar_cohortId_week_key" ON "CareerSeminar"("cohortId", "week");

-- AddForeignKey
ALTER TABLE "CareerSeminar" ADD CONSTRAINT "CareerSeminar_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "CareerCohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;

