import prisma from "../config/database.js";
import AppError from "../utils/AppError.js";

export const completeCookingSession = async ({
  userId,
  sessionId,
  pantryId,
}) => {
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

  if (session.recipe.ingredients.length === 0) {
    throw new AppError(
      "Recipe has no ingredients",
      400,
      "RECIPE_HAS_NO_INGREDIENTS"
    );
  }

  return prisma.$transaction(async (tx) => {
    const pantryItems = await tx.pantryItem.findMany({
      where: {
        pantryId,
      },
    });

    const normalizedPantryItems = pantryItems.map((item) => ({
      ...item,
      normalizedName: item.name.trim().toLowerCase(),
      normalizedUnit: item.unit.trim().toLowerCase(),
    }));

    const deductions = [];

    for (const ingredient of session.recipe.ingredients) {
      const normalizedName = ingredient.name
        .trim()
        .toLowerCase();

      const normalizedUnit = ingredient.unit
        .trim()
        .toLowerCase();

      const pantryItem = normalizedPantryItems.find(
        (item) =>
          item.normalizedName === normalizedName &&
          item.normalizedUnit === normalizedUnit
      );

      if (!pantryItem) {
        throw new AppError(
          `Pantry item not found for ingredient: ${ingredient.name}`,
          400,
          "PANTRY_INGREDIENT_NOT_FOUND"
        );
      }

      if (pantryItem.quantity < ingredient.quantity) {
        throw new AppError(
          `Insufficient stock for ingredient: ${ingredient.name}`,
          400,
          "INSUFFICIENT_STOCK"
        );
      }

      deductions.push({
        itemId: pantryItem.id,
        quantity: ingredient.quantity,
      });
    }

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
          "Insufficient stock",
          400,
          "INSUFFICIENT_STOCK"
        );
      }
    }

    const completedSession = await tx.cookingSession.update({
      where: {
        id: sessionId,
      },
      data: {
        status: "completed",
        completedAt: new Date(),
        currentStep: session.totalSteps,
      },
    });

    const updatedItems = await tx.pantryItem.findMany({
      where: {
        id: {
          in: deductions.map(
            (deduction) => deduction.itemId
          ),
        },
        pantryId,
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      session: completedSession,
      recipeId: session.recipeId,
      pantryId,
      consumed: session.recipe.ingredients.map(
        (ingredient) => ({
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
        })
      ),
      items: updatedItems,
    };
  });
};