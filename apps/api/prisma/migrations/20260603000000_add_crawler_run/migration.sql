-- Persist crawler run history so ops can audit which run was when, which
-- source completed, and what the per-source CrawlerRunSummary returned.
CREATE TABLE "CrawlerRun" (
  "id"            TEXT NOT NULL,
  "source"        TEXT NOT NULL,
  "triggeredBy"   TEXT NOT NULL DEFAULT 'manual',
  "startedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt"    TIMESTAMP(3),
  "elapsedMs"     INTEGER NOT NULL DEFAULT 0,
  "ok"            BOOLEAN NOT NULL DEFAULT false,
  "errorMessage"  TEXT,
  "buddiesResult" JSONB,
  "wantedResult"  JSONB,
  CONSTRAINT "CrawlerRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CrawlerRun_startedAt_idx" ON "CrawlerRun" ("startedAt");
CREATE INDEX "CrawlerRun_source_idx"    ON "CrawlerRun" ("source");
CREATE INDEX "CrawlerRun_ok_idx"        ON "CrawlerRun" ("ok");
