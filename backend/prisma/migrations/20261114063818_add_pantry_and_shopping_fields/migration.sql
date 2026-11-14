-- AlterTable
ALTER TABLE "PantryItem" ADD COLUMN     "category" TEXT DEFAULT 'Other',
ADD COLUMN     "minimumQuantity" DOUBLE PRECISION DEFAULT 1,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "purchaseDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ShoppingListItem" ADD COLUMN     "category" TEXT DEFAULT 'Other',
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'MEDIUM';

-- CreateIndex
CREATE INDEX "PantryItem_category_idx" ON "PantryItem"("category");

-- CreateIndex
CREATE INDEX "ShoppingListItem_priority_idx" ON "ShoppingListItem"("priority");
