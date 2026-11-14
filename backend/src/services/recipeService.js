import prisma from "../config/database.js";

export const createRecipe = async ({
  userId,
  title,
  description,
  instructions,
  prepTime,
  cookTime,
  servings,
  ingredients,
  nutrition,
}) => {
  return prisma.$transaction(async (tx) => {
    const recipe = await tx.recipe.create({
      data: {
        userId,
        title,
        description,
        instructions,
        prepTime,
        cookTime,
        servings,
      },
    });

    if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
      for (const ing of ingredients) {
        if (
          !ing ||
          !ing.name ||
          typeof ing.name !== "string" ||
          !ing.name.trim() ||
          ing.quantity === undefined ||
          ing.quantity === null ||
          isNaN(Number(ing.quantity)) ||
          Number(ing.quantity) <= 0 ||
          !ing.unit ||
          typeof ing.unit !== "string" ||
          !ing.unit.trim()
        ) {
          const err = new Error("Each ingredient must have a valid name, quantity > 0, and unit");
          err.statusCode = 400;
          err.code = "INVALID_INGREDIENT_DATA";
          throw err;
        }

        await tx.recipeIngredient.create({
          data: {
            recipeId: recipe.id,
            name: ing.name.trim(),
            quantity: Number(ing.quantity),
            unit: ing.unit.trim(),
          },
        });
      }
    }

    if (nutrition && typeof nutrition === "object") {
      await tx.recipeNutrition.create({
        data: {
          recipeId: recipe.id,
          calories: nutrition.calories ?? 0,
          protein: nutrition.protein ?? 0,
          carbohydrates: nutrition.carbohydrates ?? 0,
          fat: nutrition.fat ?? 0,
          fiber: nutrition.fiber ?? 0,
          sugar: nutrition.sugar ?? 0,
        },
      });
    }

    return tx.recipe.findUnique({
      where: { id: recipe.id },
      include: {
        ingredients: true,
        nutrition: true,
      },
    });
  });
};

export const getRecipes = async ({ userId }) => {
  return prisma.recipe.findMany({
    where: {
      userId,
    },
    include: {
      ingredients: true,
      nutrition: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getRecipeById = async ({ userId, recipeId }) => {
  return prisma.recipe.findFirst({
    where: {
      id: recipeId,
      userId,
    },
    include: {
      ingredients: true,
      nutrition: true,
    },
  });
};

export const updateRecipe = async ({
  userId,
  recipeId,
  title,
  description,
  instructions,
  prepTime,
  cookTime,
  servings,
  ingredients,
  nutrition,
}) => {
  return prisma.$transaction(async (tx) => {
    // 1. Verify recipe exists and belongs to this user
    const recipe = await tx.recipe.findFirst({
      where: {
        id: recipeId,
        userId,
      },
    });

    if (!recipe) {
      return null;
    }

    // 2. Update scalar fields if provided
    const scalarUpdates = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(instructions !== undefined && { instructions }),
      ...(prepTime !== undefined && { prepTime }),
      ...(cookTime !== undefined && { cookTime }),
      ...(servings !== undefined && { servings }),
    };

    if (Object.keys(scalarUpdates).length > 0) {
      await tx.recipe.update({
        where: { id: recipeId },
        data: scalarUpdates,
      });
    }

    // 3. Atomically synchronize ingredients if provided
    if (ingredients !== undefined && Array.isArray(ingredients)) {
      const currentIngredients = await tx.recipeIngredient.findMany({
        where: { recipeId },
      });
      const currentMap = new Map(currentIngredients.map((i) => [i.id, i]));

      // Verify that any provided ingredient ID belongs to this recipe and all items have valid data
      for (const ing of ingredients) {
        if (ing.id && !currentMap.has(ing.id)) {
          const err = new Error(`Ingredient with id ${ing.id} does not belong to this recipe`);
          err.statusCode = 400;
          err.code = "INVALID_INGREDIENT_ID";
          throw err;
        }

        if (
          !ing ||
          !ing.name ||
          typeof ing.name !== "string" ||
          !ing.name.trim() ||
          ing.quantity === undefined ||
          ing.quantity === null ||
          isNaN(Number(ing.quantity)) ||
          Number(ing.quantity) <= 0 ||
          !ing.unit ||
          typeof ing.unit !== "string" ||
          !ing.unit.trim()
        ) {
          const err = new Error("Each ingredient must have a valid name, quantity > 0, and unit");
          err.statusCode = 400;
          err.code = "INVALID_INGREDIENT_DATA";
          throw err;
        }
      }

      const payloadIdSet = new Set(ingredients.filter((i) => i.id).map((i) => i.id));

      // Remove ingredients that are no longer in the payload
      const toDeleteIds = currentIngredients
        .filter((curr) => !payloadIdSet.has(curr.id))
        .map((curr) => curr.id);

      if (toDeleteIds.length > 0) {
        await tx.recipeIngredient.deleteMany({
          where: { id: { in: toDeleteIds } },
        });
      }

      // Add new ingredients and update modified existing ingredients
      for (const ing of ingredients) {
        const cleanName = ing.name.trim();
        const cleanQty = Number(ing.quantity);
        const cleanUnit = ing.unit.trim();

        if (!ing.id) {
          // New ingredient: create
          await tx.recipeIngredient.create({
            data: {
              recipeId,
              name: cleanName,
              quantity: cleanQty,
              unit: cleanUnit,
            },
          });
        } else {
          // Existing ingredient: only update if changed to preserve unchanged record state
          const current = currentMap.get(ing.id);
          const hasChanged =
            current.name !== cleanName ||
            current.quantity !== cleanQty ||
            current.unit !== cleanUnit;

          if (hasChanged) {
            await tx.recipeIngredient.update({
              where: { id: ing.id },
              data: {
                name: cleanName,
                quantity: cleanQty,
                unit: cleanUnit,
              },
            });
          }
        }
      }
    }

    // 4. Atomically synchronize nutrition if provided
    if (nutrition !== undefined && nutrition !== null && typeof nutrition === "object") {
      const existingNutrition = await tx.recipeNutrition.findUnique({
        where: { recipeId },
      });

      if (existingNutrition) {
        await tx.recipeNutrition.update({
          where: { recipeId },
          data: {
            ...(nutrition.calories !== undefined && { calories: nutrition.calories }),
            ...(nutrition.protein !== undefined && { protein: nutrition.protein }),
            ...(nutrition.carbohydrates !== undefined && { carbohydrates: nutrition.carbohydrates }),
            ...(nutrition.fat !== undefined && { fat: nutrition.fat }),
            ...(nutrition.fiber !== undefined && { fiber: nutrition.fiber }),
            ...(nutrition.sugar !== undefined && { sugar: nutrition.sugar }),
          },
        });
      } else {
        await tx.recipeNutrition.create({
          data: {
            recipeId,
            calories: nutrition.calories ?? 0,
            protein: nutrition.protein ?? 0,
            carbohydrates: nutrition.carbohydrates ?? 0,
            fat: nutrition.fat ?? 0,
            fiber: nutrition.fiber ?? 0,
            sugar: nutrition.sugar ?? 0,
          },
        });
      }
    }

    // 5. Return updated recipe with full relation data
    return tx.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: true,
        nutrition: true,
      },
    });
  });
};

export const deleteRecipe = async ({ userId, recipeId }) => {
  const recipe = await prisma.recipe.findFirst({
    where: {
      id: recipeId,
      userId,
    },
  });

  if (!recipe) {
    return null;
  }

  await prisma.recipe.delete({
    where: {
      id: recipeId,
    },
  });

  return true;
};
