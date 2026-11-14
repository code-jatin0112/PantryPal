-- Safe, non-destructive, data-aware migration:
-- Migration 20261114063818_add_pantry_and_shopping_fields added minimumQuantity with DEFAULT 1,
-- which backfilled pre-existing pantry records with 1.
-- This migration safely resets minimumQuantity to NULL ONLY for legacy records that were created
-- strictly before the column was introduced (i.e. updatedAt strictly before the add-column migration finished).
-- Records created or updated after the column existed could represent intentional user input
-- and are strictly preserved.

UPDATE "PantryItem"
SET "minimumQuantity" = NULL
WHERE "minimumQuantity" = 1
  AND "updatedAt" < (
    SELECT MIN("finished_at")
    FROM "_prisma_migrations"
    WHERE "migration_name" LIKE '%add_pantry_and_shopping_fields%'
  );
