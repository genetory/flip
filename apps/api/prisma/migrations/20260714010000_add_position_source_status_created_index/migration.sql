-- /positions "오직 Aply에서만!" 탭이 프로덕션에서 2~5초 걸리던 원인.
--
-- 이 인덱스는 schema.prisma 에는 있었지만 이를 만드는 마이그레이션이 없어서
-- 로컬(db push)에만 존재하고 스테이징/프로덕션에는 적용된 적이 없었다.
--
-- 인덱스가 없으면 (status=OPEN AND sourceProvider=INTERNAL) + ORDER BY createdAt DESC LIMIT 20
-- 쿼리가 createdAt 인덱스를 최신순으로 훑으며 조건에 맞는 20건을 찾는데,
-- INTERNAL 공고는 희소해서 수만 건을 스캔해야 한다. 반면 WANTED 는 대부분이라 즉시 채워져 빠르다.
-- (측정: 프로덕션 INTERNAL 2.2~5.5초 vs WANTED 0.1초 — 번역과 무관하게 한국어에서도 동일)
--
-- IF NOT EXISTS — 일부 환경은 db push 로 이미 만들어져 있을 수 있다.

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Position_sourceProvider_status_createdAt_id_idx"
  ON "Position"("sourceProvider", "status", "createdAt", "id");
