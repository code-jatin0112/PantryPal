/*
  Warnings:

  - You are about to drop the column `date` on the `MealPlan` table. All the data in the column will be lost.
  - You are about to drop the column `mealType` on the `MealPlan` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `MealPlan` table. All the data in the column will be lost.
  - Added the required column `endDate` to the `MealPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `MealPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `peopleCount` to the `MealPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `MealPlan` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "MealPlan" DROP CONSTRAINT "MealPlan_recipeId_fkey";

-- DropIndex
DROP INDEX "MealPlan_recipeId_idx";

-- DropIndex
DROP INDEX "MealPlan_userId_date_idx";

-- DropIndex
DROP INDEX "MealPlan_userId_mealType_idx";

-- AlterTable
ALTER TABLE "MealPlan" DROP COLUMN "date",
DROP COLUMN "mealType",
DROP COLUMN "notes",
ADD COLUMN     "budget" DOUBLE PRECISION,
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "peopleCount" INTEGER NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "recipeId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "MealPlanItem" (
    "id" TEXT NOT NULL,
    "mealPlanId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "plannedDate" TIMESTAMP(3) NOT NULL,
    "mealType" TEXT NOT NULL,
    "requestedServings" INTEGER NOT NULL,
    "cuisine" TEXT,
    "recipePreference" TEXT,
    "dietaryRequirements" JSONB,
    "budgetPriority" TEXT,
    "otherPreferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "MealPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MealPlanItem_mealPlanId_idx" ON "MealPlanItem"("mealPlanId");

-- CreateIndex
CREATE INDEX "MealPlanItem_recipeId_idx" ON "MealPlanItem"("recipeId");

-- CreateIndex
CREATE INDEX "MealPlanItem_plannedDate_idx" ON "MealPlanItem"("plannedDate");

-- CreateIndex
CREATE INDEX "MealPlanItem_mealPlanId_plannedDate_idx" ON "MealPlanItem"("mealPlanId", "plannedDate");

-- CreateIndex
CREATE INDEX "MealPlan_userId_startDate_idx" ON "MealPlan"("userId", "startDate");

-- CreateIndex
CREATE INDEX "MealPlan_userId_endDate_idx" ON "MealPlan"("userId", "endDate");

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanItem" ADD CONSTRAINT "MealPlanItem_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanItem" ADD CONSTRAINT "MealPlanItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanItem" ADD CONSTRAINT "MealPlanItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
