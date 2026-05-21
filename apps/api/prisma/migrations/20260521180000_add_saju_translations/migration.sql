-- Cached translations of the dynamic text fields keyed by locale, e.g.
-- { "en": { "interpretation": "...", "strengths": [...], ... } }.
-- Generated lazily by the LLM the first time a viewer's locale differs
-- from the prediction's creation locale, so we don't pay 6x at creation.
ALTER TABLE "SajuPrediction" ADD COLUMN "translations" JSONB;
