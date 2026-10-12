-- 모의 면접 콘텐츠 — additive. 기존 테이블/컬럼/데이터 무변경.
-- InterviewQuestionReport: 실제 면접을 본 학생이 남긴 '나온 질문'(회사 이름으로 모아 연습 질문으로).
-- InterviewAnswerExample: '잘해요'를 받은 답 중 익명 공개에 동의한 것(같은 질문 연습자에게 예시로).

CREATE TABLE "InterviewQuestionReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT,
    "positionId" TEXT,
    "organizationName" TEXT NOT NULL,
    "positionTitle" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewQuestionReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InterviewQuestionReport_organizationName_createdAt_idx" ON "InterviewQuestionReport"("organizationName", "createdAt");
CREATE INDEX "InterviewQuestionReport_positionId_idx" ON "InterviewQuestionReport"("positionId");
CREATE INDEX "InterviewQuestionReport_createdAt_idx" ON "InterviewQuestionReport"("createdAt");
CREATE INDEX "InterviewQuestionReport_userId_applicationId_idx" ON "InterviewQuestionReport"("userId", "applicationId");

ALTER TABLE "InterviewQuestionReport" ADD CONSTRAINT "InterviewQuestionReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "InterviewAnswerExample" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewAnswerExample_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InterviewAnswerExample_userId_question_key" ON "InterviewAnswerExample"("userId", "question");
CREATE INDEX "InterviewAnswerExample_question_score_idx" ON "InterviewAnswerExample"("question", "score");

ALTER TABLE "InterviewAnswerExample" ADD CONSTRAINT "InterviewAnswerExample_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
