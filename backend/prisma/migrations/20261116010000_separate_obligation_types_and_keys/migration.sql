-- AlterTable
ALTER TABLE "AccountDeletionObligation" ADD COLUMN "obligationKey" TEXT;
ALTER TABLE "AccountDeletionObligation" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'ACCOUNT_DELETION';

-- Backfill existing rows if any
UPDATE "AccountDeletionObligation" SET "obligationKey" = 'ACCOUNT:' || "userId" WHERE "obligationKey" IS NULL;

-- Make obligationKey NOT NULL
ALTER TABLE "AccountDeletionObligation" ALTER COLUMN "obligationKey" SET NOT NULL;

-- Drop old unique index on userId
DROP INDEX IF EXISTS "AccountDeletionObligation_userId_key";

-- Create new unique index on obligationKey
CREATE UNIQUE INDEX "AccountDeletionObligation_obligationKey_key" ON "AccountDeletionObligation"("obligationKey");

-- Create index on type
CREATE INDEX "AccountDeletionObligation_type_idx" ON "AccountDeletionObligation"("type");
