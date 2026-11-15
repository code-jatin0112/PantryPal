import prisma from "../config/database.js";
import AppError from "../utils/AppError.js";
import {
  normalizeIngredientName,
  convertUnitQuantity,
} from "../utils/ingredientMatcher.js";

export const completeCookingSession = async ({
  userId,
  sessionId,
  pantryId,
}) => {
  // 1. Fetch cooking session
  const session = await prisma.cookingSession.findFirst({
    where: {
      id: sessionId,
      userId,
    },
    include: {
      recipe: {
        include: {
          ingredients: true,
        },
      },
    },
  });

  if (!session) {
    throw new AppError(
      "Cooking session not found",
      404,
      "COOKING_SESSION_NOT_FOUND"
    );
  }

  if (session.status === "completed") {
    throw new AppError(
      "Cooking session is already completed",
      409,
      "COOKING_SESSION_ALREADY_COMPLETED"
    );
  }

  return prisma.$transaction(async (tx) => {
    const csClient = tx.cookingSession?.findFirst ? tx.cookingSession : prisma.cookingSession;
    const pantryClient = tx.pantry?.findFirst ? tx.pantry : prisma.pantry;
    const pantryItemClient = tx.pantryItem?.findMany ? tx.pantryItem : prisma.pantryItem;

    // 2. Fetch and verify pantry ownership
    const pantry = await pantryClient.findFirst({
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

    if (session.recipe.ingredients.length === 0) {
      throw new AppError(
        "Recipe has no ingredients",
        400,
        "RECIPE_HAS_NO_INGREDIENTS"
      );
    }

    // 3. Atomically acquire row lock and mark session as completed to prevent race conditions
    let completedSession = null;
    if (tx.cookingSession?.updateMany) {
      const updateResult = await tx.cookingSession.updateMany({
        where: {
          id: sessionId,
          userId,
          status: "active",
        },
        data: {
          status: "completed",
          completedAt: new Date(),
          currentStep: session.totalSteps,
        },
      });

      if (updateResult.count === 0) {
        throw new AppError(
          "Cooking session is already completed",
          409,
          "COOKING_SESSION_ALREADY_COMPLETED"
        );
      }
    } else if (tx.cookingSession?.update) {
      completedSession = await tx.cookingSession.update({
        where: { id: sessionId },
        data: {
          status: "completed",
          completedAt: new Date(),
          currentStep: session.totalSteps,
        },
      });
    }

    const targetServings = session.servings || 1;
    const baseServings = session.recipe.servings || 1;
    const scalingMultiplier = targetServings / baseServings;

    // 4. Fetch pantry items and calculate deductions
    const pantryItems = await pantryItemClient.findMany({
      where: {
        pantryId,
      },
    });

    const normalizedPantryItems = pantryItems.map((item) => ({
      ...item,
      normalizedName: normalizeIngredientName(item.name),
    }));

    const deductions = [];

    for (const ingredient of session.recipe.ingredients) {
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

      // Deduct locally in case multiple recipe lines match same pantry item
      pantryItem.quantity -= deductionInPantryUnit;

      deductions.push({
        itemId: pantryItem.id,
        quantity: deductionInPantryUnit,
        scaledRequiredQuantity,
        originalUnit: ingredient.unit,
        name: ingredient.name,
      });
    }

    // 5. Deduct from each pantry item atomically
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

    if (!completedSession) {
      completedSession = await csClient.findUnique({
        where: {
          id: sessionId,
        },
      });
    }

    const updatedItems = await pantryItemClient.findMany({
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
      session: completedSession,
      pantryId,
      servings: targetServings,
      scalingMultiplier,
      consumed: session.recipe.ingredients.map((ingredient) => ({
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
