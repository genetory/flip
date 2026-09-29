-- Career Launch 학생 → 운영진 질문/답변 — additive. 기존 테이블/컬럼/데이터 무변경.
-- answerBody 가 null = 아직 답변 대기중. 운영진이 답을 달면 answeredAt/answeredByUserId 가 채워진다.
-- CareerLaunchFeedback(운영자 → 학생 코칭)과 방향이 반대라 별도 테이블.

CREATE TABLE "CareerLaunchQuestion" (
    "id" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "stepNo" INTEGER,
    "answerBody" TEXT,
    "answeredByUserId" TEXT,
    "answeredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerLaunchQuestion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CareerLaunchQuestion_studentUserId_createdAt_idx" ON "CareerLaunchQuestion"("studentUserId", "createdAt");

-- 운영자 콘솔이 '미답변 먼저'로 훑는다.
CREATE INDEX "CareerLaunchQuestion_answeredAt_createdAt_idx" ON "CareerLaunchQuestion"("answeredAt", "createdAt");

ALTER TABLE "CareerLaunchQuestion" ADD CONSTRAINT "CareerLaunchQuestion_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CareerLaunchQuestion" ADD CONSTRAINT "CareerLaunchQuestion_answeredByUserId_fkey" FOREIGN KEY ("answeredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
