-- pgvector extension for native ANN search
CREATE EXTENSION IF NOT EXISTS vector;

-- Replace the Float[] embedding column with a proper vector(768) column.
-- 768 dims is a deliberate downscale from 1536: text-embedding-3-large
-- supports lower-dim outputs via the `dimensions` request param, and at
-- 768 the quality loss is negligible while storage drops 4x (float8 ->
-- float4) and ANN index size drops proportionally. Existing Float[]
-- data is dropped because it's a different dim and the backfill is
-- cheap (~30s for the full corpus).
ALTER TABLE "Position" DROP COLUMN IF EXISTS "embedding";
ALTER TABLE "Position" ADD COLUMN "embedding" vector(768);

-- HNSW index for cosine distance — sub-100ms ANN on any corpus size
-- the project will plausibly reach. m=16 / ef_construction=64 are the
-- pgvector defaults and well-tuned for general use.
CREATE INDEX "Position_embedding_hnsw_idx"
  ON "Position"
  USING hnsw ("embedding" vector_cosine_ops);

-- Composite index on the candidate filter for /positions search. The
-- planner can use this to narrow the pool before the ANN scan.
CREATE INDEX IF NOT EXISTS "Position_status_provider_role_idx"
  ON "Position" ("status", "sourceProvider", "preferredJobRole");
