-- Safe, data-aware migration:
-- Migration 20261114063818_add_pantry_and_shopping_fields added minimumQuantity with DEFAULT 1,
-- which caused Postgres to backfill all pre-existing pantry records with 1.
-- Migration 20261114065541_remove_min_quantity_default dropped the column default for future inserts,
-- but did not revert the unintentionally backfilled rows.
-- This data migration safely resets minimumQuantity to NULL for legacy records that were created
-- before the default was removed and never explicitly configured by the user,
-- ensuring they dynamically fall back to the global low-stock threshold (5).
-- User-configured explicit thresholds (updated or created after default removal, or non-1 values) are preserved.

UPDATE "PantryItem"
SET "minimumQuantity" = NULL
WHERE "minimumQuantity" = 1
  AND (
    "updatedAt" <= (
      SELECT COALESCE(MIN("finished_at"), '2026-11-14 12:25:41.706+00'::timestamptz)
      FROM "_prisma_migrations"
      WHERE "migration_name" LIKE '%remove_min_quantity_default%'
    )
    OR "updatedAt" <= '2026-11-14 12:25:41.706+00'::timestamptz
  );
