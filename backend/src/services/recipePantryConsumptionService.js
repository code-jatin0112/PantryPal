import prisma from "../config/database.js";
import AppError from "../utils/AppError.js";
import {
  normalizeIngredientName,
  convertUnitQuantity,
} from "../utils/ingredientMatcher.js";

export const consumeRecipeFromPantry = async ({
  userId,
  recipeId,
  pantryId,
  servings,
}) => {
  const recipe = await prisma.recipe.findFirst({
    where: {
      id: recipeId,
      userId,
    },
    include: {
      ingredients: true,
    },
  });

  if (!recipe) {
    throw new AppError(
      "Recipe not found",
      404,
      "RECIPE_NOT_FOUND"
    );
  }

  const pantry = await prisma.pantry.findFirst({
    where: {
      id: pantryId,
      userId,
    },
  });

  if (!pantry) {
    throw new AppError(
      "Pantry not found",
      404,
      "PANTRY_NOT_FOUND"
    );
  }

  if (recipe.ingredients.length === 0) {
    throw new AppError(
      "Recipe has no ingredients",
      400,
      "RECIPE_HAS_NO_INGREDIENTS"
    );
  }

  const targetServings = servings ? Number(servings) : (recipe.servings || 1);
  const baseServings = recipe.servings || 1;
  const scalingMultiplier = targetServings / baseServings;

  return prisma.$transaction(async (tx) => {
    const pantryItems = await tx.pantryItem.findMany({
      where: {
        pantryId,
      },
    });

    const normalizedPantryItems = pantryItems.map((item) => ({
      ...item,
      normalizedName: normalizeIngredientName(item.name),
    }));

    const deductions = [];

    for (const ingredient of recipe.ingredients) {
      const normalizedName = normalizeIngredientName(ingredient.name);
      const scaledRequiredQuantity = ingredient.quantity * scalingMultiplier;

      const pantryItem = normalizedPantryItems.find(
        (item) => item.normalizedName === normalizedName
      );

      if (!pantryItem) {
        throw new AppError(
          `Pantry item not found for ingredient: ${ingredient.name}`,
          400,
          "PANTRY_INGREDIENT_NOT_FOUND"
        );
      }

      const deductionInPantryUnit = convertUnitQuantity(
        scaledRequiredQuantity,
        ingredient.unit,
        pantryItem.unit
      );

      if (deductionInPantryUnit === null) {
        throw new AppError(
          `Incompatible unit for ingredient: ${ingredient.name} (${ingredient.unit} cannot be converted to ${pantryItem.unit})`,
          400,
          "INCOMPATIBLE_UNIT"
        );
      }

      if (pantryItem.quantity < deductionInPantryUnit) {
        throw new AppError(
          `Insufficient stock for ingredient: ${ingredient.name}. Required: ${deductionInPantryUnit} ${pantryItem.unit}, Available: ${pantryItem.quantity} ${pantryItem.unit}`,
          400,
          "INSUFFICIENT_STOCK"
        );
      }

      // Deduct locally for multiple ingredients using same pantry item
      pantryItem.quantity -= deductionInPantryUnit;

      deductions.push({
        itemId: pantryItem.id,
        quantity: deductionInPantryUnit,
        scaledRequiredQuantity,
        originalUnit: ingredient.unit,
        name: ingredient.name,
      });
    }

    // Apply DB updates
    for (const deduction of deductions) {
      const result = await tx.pantryItem.updateMany({
        where: {
          id: deduction.itemId,
          pantryId,
          quantity: {
            gte: deduction.quantity,
          },
        },
        data: {
          quantity: {
            decrement: deduction.quantity,
          },
        },
      });

      if (result.count === 0) {
        throw new AppError(
          `Insufficient stock for ingredient: ${deduction.name}`,
          400,
          "INSUFFICIENT_STOCK"
        );
      }
    }

    const updatedItems = await tx.pantryItem.findMany({
      where: {
        id: {
          in: deductions.map((deduction) => deduction.itemId),
        },
        pantryId,
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      recipeId,
      pantryId,
      servings: targetServings,
      scalingMultiplier,
      consumed: recipe.ingredients.map((ingredient) => ({
        name: ingredient.name,
        quantity: ingredient.quantity * scalingMultiplier,
        unit: ingredient.unit,
        baseQuantity: ingredient.quantity,
        baseUnit: ingredient.unit,
      })),
      items: updatedItems,
    };
  });
};
