-- 시맨틱 인재검색용 이력서 임베딩(pgvector 768차원) — Position.embedding 과 동일 구조.
-- vector 확장은 이미 활성(Position 에서 사용 중).
ALTER TABLE "Resume" ADD COLUMN IF NOT EXISTS "embedding" vector(768);
ALTER TABLE "Resume" ADD COLUMN IF NOT EXISTS "embeddingUpdatedAt" TIMESTAMP(3);
