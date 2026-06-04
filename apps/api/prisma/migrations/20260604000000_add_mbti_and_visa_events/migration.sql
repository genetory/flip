-- MBTI × 한국 직장 매칭 이벤트 + 비자 가능성 체크 이벤트
-- Both follow the saju pattern: anonymous prediction → share slug → claim
-- on signup. userId is nullable so the result page works pre-signup.

CREATE TABLE "MbtiPrediction" (
  "id"                     TEXT      NOT NULL,
  "mbtiType"               TEXT      NOT NULL,
  "name"                   TEXT,
  "nationality"            TEXT,
  "recommendedRoleNames"   TEXT[],
  "recommendedPositionIds" TEXT[],
  "cultureSummary"         TEXT      NOT NULL DEFAULT '',
  "interpretation"         TEXT      NOT NULL DEFAULT '',
  "shareSlug"              TEXT      NOT NULL,
  "userId"                 TEXT,
  "ipHash"                 TEXT,
  "locale"                 TEXT      NOT NULL DEFAULT 'ko',
  "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "claimedAt"              TIMESTAMP(3),
  CONSTRAINT "MbtiPrediction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MbtiPrediction_shareSlug_key" ON "MbtiPrediction" ("shareSlug");
CREATE INDEX        "MbtiPrediction_userId_idx"    ON "MbtiPrediction" ("userId");
CREATE INDEX        "MbtiPrediction_createdAt_idx" ON "MbtiPrediction" ("createdAt");
CREATE INDEX        "MbtiPrediction_mbtiType_idx"  ON "MbtiPrediction" ("mbtiType");

CREATE TABLE "VisaCheckResult" (
  "id"                     TEXT      NOT NULL,
  "name"                   TEXT,
  "nationality"            TEXT      NOT NULL,
  "currentVisa"            TEXT,
  "educationLevel"         TEXT      NOT NULL,
  "majorCategory"          TEXT,
  "koreanLevel"            TEXT      NOT NULL,
  "workYears"              INTEGER   NOT NULL DEFAULT 0,
  "targetRole"             TEXT,
  "eligibleVisas"          JSONB     NOT NULL,
  "recommendedPositionIds" TEXT[],
  "shareSlug"              TEXT      NOT NULL,
  "userId"                 TEXT,
  "ipHash"                 TEXT,
  "locale"                 TEXT      NOT NULL DEFAULT 'ko',
  "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "claimedAt"              TIMESTAMP(3),
  CONSTRAINT "VisaCheckResult_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VisaCheckResult_shareSlug_key"  ON "VisaCheckResult" ("shareSlug");
CREATE INDEX        "VisaCheckResult_userId_idx"     ON "VisaCheckResult" ("userId");
CREATE INDEX        "VisaCheckResult_createdAt_idx"  ON "VisaCheckResult" ("createdAt");
CREATE INDEX        "VisaCheckResult_nationality_idx" ON "VisaCheckResult" ("nationality");
