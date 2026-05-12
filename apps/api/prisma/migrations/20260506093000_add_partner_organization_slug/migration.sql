ALTER TABLE "PartnerOrganization" ADD COLUMN "slug" TEXT;

WITH base AS (
  SELECT
    id,
    lower(regexp_replace(coalesce(nullif(trim(name), ''), 'partner'), '[^a-z0-9]+', '-', 'g')) AS raw_slug
  FROM "PartnerOrganization"
), normalized AS (
  SELECT
    id,
    trim(both '-' FROM regexp_replace(raw_slug, '-{2,}', '-', 'g')) AS base_slug
  FROM base
), ranked AS (
  SELECT
    id,
    CASE WHEN base_slug = '' THEN 'partner' ELSE base_slug END AS base_slug,
    row_number() OVER (PARTITION BY CASE WHEN base_slug = '' THEN 'partner' ELSE base_slug END ORDER BY id) AS rn
  FROM normalized
)
UPDATE "PartnerOrganization" p
SET "slug" = CASE
  WHEN ranked.rn = 1 THEN ranked.base_slug
  ELSE ranked.base_slug || '-' || ranked.rn::text
END
FROM ranked
WHERE p.id = ranked.id;

ALTER TABLE "PartnerOrganization" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "PartnerOrganization_slug_key" ON "PartnerOrganization"("slug");
