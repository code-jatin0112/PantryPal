/*
  Warnings:

  - You are about to drop the column `recipeId` on the `MealPlan` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `MealPlanItem` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "MealPlan" DROP CONSTRAINT "MealPlan_recipeId_fkey";

-- DropForeignKey
ALTER TABLE "MealPlanItem" DROP CONSTRAINT "MealPlanItem_userId_fkey";

-- AlterTable
ALTER TABLE "MealPlan" DROP COLUMN "recipeId";

-- AlterTable
ALTER TABLE "MealPlanItem" DROP COLUMN "userId";
