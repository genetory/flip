DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'PartnerOrganization'
      AND column_name = 'slug'
  ) THEN
    CREATE INDEX IF NOT EXISTS "PartnerOrganization_slug_idx" ON "PartnerOrganization"("slug");
  END IF;
END
$$;
