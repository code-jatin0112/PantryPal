import prisma from "../config/database.js";
import AppError from "../utils/AppError.js";

import {
  generateMealPlanAnalysis,
} from "./mealPlanningEngine/mealPlanningEngine.js";

const recipeSelect = {
  id: true,
  title: true,
  description: true,
  prepTime: true,
  cookTime: true,
  servings: true,
};

const mealPlanItemInclude = {
  recipe: {
    select: recipeSelect,
  },
};

const formatMealPlanResponse = (mealPlan) => {
  if (!mealPlan) return null;
  const dishes = mealPlan.items ?? [];
  return {
    ...mealPlan,
    dishes,
  };
};

const validateRecipeOwnership = async ({ userId, recipeId }) => {
  const recipe = await prisma.recipe.findFirst({
    where: {
      id: recipeId,
      userId,
    },
    select: {
      id: true,
    },
  });

  return recipe;
};

export const createMealPlan = async ({
  userId,
  name,
  startDate,
  endDate,
  peopleCount,
  budget,
  dishes,
}) => {
  if (new Date(endDate) < new Date(startDate)) {
    throw new AppError(
      "End date cannot precede start date",
      400,
      "INVALID_MEAL_PLAN_DATE_RANGE"
    );
  }

  const recipeIds = [
    ...new Set(dishes.map((dish) => dish.recipeId)),
  ];

  const recipes = await prisma.recipe.findMany({
    where: {
      id: {
        in: recipeIds,
      },
      userId,
    },
    select: {
      id: true,
    },
  });

  const validRecipeIds = new Set(
    recipes.map((recipe) => recipe.id)
  );

  const invalidRecipe = dishes.find(
    (dish) => !validRecipeIds.has(dish.recipeId)
  );

  if (invalidRecipe) {
    throw new AppError(
      `Recipe not found: ${invalidRecipe.recipeId}`,
      404,
      "RECIPE_NOT_FOUND"
    );
  }

  return prisma.$transaction(async (tx) => {
    const mealPlan = await tx.mealPlan.create({
      data: {
        userId,
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        peopleCount,
        budget,
        items: {
          create: dishes.map((dish) => ({
            recipeId: dish.recipeId,
            plannedDate: dish.plannedDate
              ? new Date(dish.plannedDate)
              : new Date(startDate),
            mealType: dish.mealType ?? "other",
            requestedServings: dish.requestedServings,
            cuisine: dish.cuisine,
            recipePreference: dish.recipePreference,
            dietaryRequirements: dish.dietaryRequirements,
            budgetPriority: dish.budgetPriority,
            otherPreferences: dish.otherPreferences,
          })),
        },
      },
      include: {
        items: {
          include: mealPlanItemInclude,
          orderBy: {
            plannedDate: "asc",
          },
        },
      },
    });

    return formatMealPlanResponse(mealPlan);
  });
};

export const getMealPlans = async ({
  userId,
  startDate,
  endDate,
}) => {
  const mealPlans = await prisma.mealPlan.findMany({
    where: {
      userId,
      ...(startDate !== undefined &&
        endDate !== undefined && {
          startDate: {
            lte: endDate,
          },
          endDate: {
            gte: startDate,
          },
        }),
    },
    orderBy: {
      startDate: "asc",
    },
    include: {
      items: {
        include: mealPlanItemInclude,
        orderBy: {
          plannedDate: "asc",
        },
      },
    },
  });

  return mealPlans.map(formatMealPlanResponse);
};

export const getMealPlanById = async ({
  userId,
  mealPlanId,
}) => {
  const mealPlan = await prisma.mealPlan.findFirst({
    where: {
      id: mealPlanId,
      userId,
    },
    include: {
      items: {
        include: mealPlanItemInclude,
        orderBy: {
          plannedDate: "asc",
        },
      },
    },
  });

  return formatMealPlanResponse(mealPlan);
};

export const updateMealPlan = async ({
  userId,
  mealPlanId,
  name,
  startDate,
  endDate,
  peopleCount,
  budget,
  dishes,
}) => {
  const executeScalarUpdate = async (client) => {
    const mealPlan = await client.mealPlan.findFirst({
      where: {
        id: mealPlanId,
        userId,
      },
    });

    if (!mealPlan) {
      return null;
    }

    const nextStartDate =
      startDate !== undefined
        ? new Date(startDate)
        : mealPlan.startDate;

    const nextEndDate =
      endDate !== undefined
        ? new Date(endDate)
        : mealPlan.endDate;

    if (nextEndDate < nextStartDate) {
      throw new AppError(
        "End date cannot precede start date",
        400,
        "INVALID_MEAL_PLAN_DATE_RANGE"
      );
    }

    const scalarUpdates = {
      ...(name !== undefined && { name }),
      ...(startDate !== undefined && {
        startDate: new Date(startDate),
      }),
      ...(endDate !== undefined && {
        endDate: new Date(endDate),
      }),
      ...(peopleCount !== undefined && { peopleCount }),
      ...(budget !== undefined && { budget }),
    };

    const updated = await client.mealPlan.update({
      where: {
        id: mealPlanId,
      },
      data: scalarUpdates,
      include: {
        items: {
          include: mealPlanItemInclude,
          orderBy: {
            plannedDate: "asc",
          },
        },
      },
    });

    return formatMealPlanResponse(updated);
  };

  if (dishes === undefined) {
    return executeScalarUpdate(prisma);
  }

  return prisma.$transaction(async (tx) => {
    const mealPlanClient = tx.mealPlan?.findFirst ? tx.mealPlan : prisma.mealPlan;
    const recipeClient = tx.recipe?.findMany ? tx.recipe : prisma.recipe;
    const itemClient = tx.mealPlanItem?.findMany ? tx.mealPlanItem : prisma.mealPlanItem;

    const mealPlan = await mealPlanClient.findFirst({
      where: {
        id: mealPlanId,
        userId,
      },
    });

    if (!mealPlan) {
      return null;
    }

    const nextStartDate =
      startDate !== undefined
        ? new Date(startDate)
        : mealPlan.startDate;

    const nextEndDate =
      endDate !== undefined
        ? new Date(endDate)
        : mealPlan.endDate;

    if (nextEndDate < nextStartDate) {
      throw new AppError(
        "End date cannot precede start date",
        400,
        "INVALID_MEAL_PLAN_DATE_RANGE"
      );
    }

    const scalarUpdates = {
      ...(name !== undefined && { name }),
      ...(startDate !== undefined && {
        startDate: new Date(startDate),
      }),
      ...(endDate !== undefined && {
        endDate: new Date(endDate),
      }),
      ...(peopleCount !== undefined && { peopleCount }),
      ...(budget !== undefined && { budget }),
    };

    if (Object.keys(scalarUpdates).length > 0) {
      await mealPlanClient.update({
        where: {
          id: mealPlanId,
        },
        data: scalarUpdates,
      });
    }

    // Synchronize dishes if provided
    if (Array.isArray(dishes)) {
      const recipeIds = [
        ...new Set(dishes.map((dish) => dish.recipeId)),
      ];

      const validRecipes = await recipeClient.findMany({
        where: {
          id: {
            in: recipeIds,
          },
          userId,
        },
        select: {
          id: true,
        },
      });

      const validRecipeIds = new Set(
        validRecipes.map((recipe) => recipe.id)
      );

      const invalidRecipe = dishes.find(
        (dish) => !validRecipeIds.has(dish.recipeId)
      );

      if (invalidRecipe) {
        throw new AppError(
          `Recipe not found: ${invalidRecipe.recipeId}`,
          404,
          "RECIPE_NOT_FOUND"
        );
      }

      const currentItems = await itemClient.findMany({
        where: { mealPlanId },
      });
      const currentMap = new Map(currentItems.map((i) => [i.id, i]));

      // Validate that any submitted dish ID belongs to this meal plan
      for (const dish of dishes) {
        if (dish.id && !currentMap.has(dish.id)) {
          throw new AppError(
            `Invalid dish ID: ${dish.id}. Submitted dish does not belong to this meal plan`,
            400,
            "INVALID_MEAL_PLAN_DISH_ID"
          );
        }
      }

      const payloadIdSet = new Set(dishes.filter((d) => d.id).map((d) => d.id));

      // Remove deleted dishes
      const toDeleteIds = currentItems
        .filter((curr) => !payloadIdSet.has(curr.id))
        .map((curr) => curr.id);

      if (toDeleteIds.length > 0) {
        await itemClient.deleteMany({
          where: { id: { in: toDeleteIds } },
        });
      }

      // Add new or update existing dishes
      for (const dish of dishes) {
        if (!dish.id) {
          await itemClient.create({
            data: {
              mealPlanId,
              recipeId: dish.recipeId,
              plannedDate: dish.plannedDate
                ? new Date(dish.plannedDate)
                : nextStartDate,
              mealType: dish.mealType ?? "other",
              requestedServings: dish.requestedServings,
              cuisine: dish.cuisine,
              recipePreference: dish.recipePreference,
              dietaryRequirements: dish.dietaryRequirements,
              budgetPriority: dish.budgetPriority,
              otherPreferences: dish.otherPreferences,
            },
          });
        } else {
          await itemClient.update({
            where: { id: dish.id },
            data: {
              recipeId: dish.recipeId,
              plannedDate: dish.plannedDate
                ? new Date(dish.plannedDate)
                : undefined,
              mealType: dish.mealType,
              requestedServings: dish.requestedServings,
              cuisine: dish.cuisine,
              recipePreference: dish.recipePreference,
              dietaryRequirements: dish.dietaryRequirements,
              budgetPriority: dish.budgetPriority,
              otherPreferences: dish.otherPreferences,
            },
          });
        }
      }
    }

    const updated = await mealPlanClient.findUnique({
      where: { id: mealPlanId },
      include: {
        items: {
          include: mealPlanItemInclude,
          orderBy: {
            plannedDate: "asc",
          },
        },
      },
    });

    return formatMealPlanResponse(updated);
  });
};

export const addMealPlanDish = async ({
  userId,
  mealPlanId,
  recipeId,
  plannedDate,
  mealType,
  requestedServings,
  cuisine,
  recipePreference,
  dietaryRequirements,
  budgetPriority,
  otherPreferences,
}) => {
  const mealPlan = await prisma.mealPlan.findFirst({
    where: {
      id: mealPlanId,
      userId,
    },
  });

  if (!mealPlan) {
    return null;
  }

  const recipe = await validateRecipeOwnership({
    userId,
    recipeId,
  });

  if (!recipe) {
    throw new AppError(
      "Recipe not found",
      404,
      "RECIPE_NOT_FOUND"
    );
  }

  return prisma.mealPlanItem.create({
    data: {
      mealPlanId,
      recipeId,
      plannedDate: plannedDate
        ? new Date(plannedDate)
        : mealPlan.startDate,
      mealType: mealType ?? "other",
      requestedServings,
      cuisine,
      recipePreference,
      dietaryRequirements,
      budgetPriority,
      otherPreferences,
    },
    include: mealPlanItemInclude,
  });
};

export const updateMealPlanDish = async ({
  userId,
  mealPlanId,
  dishId,
  recipeId,
  plannedDate,
  mealType,
  requestedServings,
  cuisine,
  recipePreference,
  dietaryRequirements,
  budgetPriority,
  otherPreferences,
}) => {
  const dish = await prisma.mealPlanItem.findFirst({
    where: {
      id: dishId,
      mealPlanId,
      mealPlan: {
        userId,
      },
    },
  });

  if (!dish) {
    return null;
  }

  if (recipeId !== undefined) {
    const recipe = await validateRecipeOwnership({
      userId,
      recipeId,
    });

    if (!recipe) {
      throw new AppError(
        "Recipe not found",
        404,
        "RECIPE_NOT_FOUND"
      );
    }
  }

  return prisma.mealPlanItem.update({
    where: {
      id: dishId,
    },
    data: {
      ...(recipeId !== undefined && { recipeId }),
      ...(plannedDate !== undefined && {
        plannedDate: new Date(plannedDate),
      }),
      ...(mealType !== undefined && { mealType }),
      ...(requestedServings !== undefined && {
        requestedServings,
      }),
      ...(cuisine !== undefined && { cuisine }),
      ...(recipePreference !== undefined && {
        recipePreference,
      }),
      ...(dietaryRequirements !== undefined && {
        dietaryRequirements,
      }),
      ...(budgetPriority !== undefined && {
        budgetPriority,
      }),
      ...(otherPreferences !== undefined && {
        otherPreferences,
      }),
    },
    include: mealPlanItemInclude,
  });
};

export const deleteMealPlanDish = async ({
  userId,
  mealPlanId,
  dishId,
}) => {
  const dish = await prisma.mealPlanItem.findFirst({
    where: {
      id: dishId,
      mealPlanId,
      mealPlan: {
        userId,
      },
    },
  });

  if (!dish) {
    return null;
  }

  await prisma.mealPlanItem.delete({
    where: {
      id: dishId,
    },
  });

  return true;
};

export const deleteMealPlan = async ({
  userId,
  mealPlanId,
}) => {
  const mealPlan = await prisma.mealPlan.findFirst({
    where: {
      id: mealPlanId,
      userId,
    },
  });

  if (!mealPlan) {
    return null;
  }

  await prisma.mealPlan.delete({
    where: {
      id: mealPlanId,
    },
  });

  return true;
};

const getNutritionPerServing = ({
  nutrition,
  servings,
}) => {
  if (!nutrition) {
    return null;
  }

  return {
    calories: nutrition.calories / servings,
    protein: nutrition.protein / servings,
    carbs: nutrition.carbohydrates / servings,
    fat: nutrition.fat / servings,
    fiber: nutrition.fiber / servings,
  };
};

export const evaluateMealPlan = async ({
  userId,
  mealPlanId,
  pantryId,
}) => {
  const mealPlan = await prisma.mealPlan.findFirst({
    where: {
      id: mealPlanId,
      userId,
    },
    include: {
      items: {
        orderBy: {
          plannedDate: "asc",
        },
        include: {
          recipe: {
            include: {
              ingredients: true,
              nutrition: true,
            },
          },
        },
      },
    },
  });

  if (!mealPlan) {
    throw new AppError(
      "Meal plan not found",
      404,
      "MEAL_PLAN_NOT_FOUND"
    );
  }

  const pantry = await prisma.pantry.findFirst({
    where: {
      id: pantryId,
      userId,
    },
    include: {
      items: {
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  if (!pantry) {
    throw new AppError(
      "Pantry not found",
      404,
      "PANTRY_NOT_FOUND"
    );
  }

  if (mealPlan.items.length === 0) {
    throw new AppError(
      "Meal plan has no dishes",
      400,
      "MEAL_PLAN_HAS_NO_DISHES"
    );
  }

  const dishes = mealPlan.items.map((item) => {
    if (!item.recipe.servings) {
      throw new AppError(
        `Recipe servings are not defined for ${item.recipe.title}`,
        400,
        "RECIPE_SERVINGS_NOT_DEFINED"
      );
    }

    return {
      dishId: item.id,
      recipeId: item.recipe.id,
      baseServings: item.recipe.servings,
      requestedServings: item.requestedServings,
      ingredients: item.recipe.ingredients,
      nutritionPerServing: getNutritionPerServing({
        nutrition: item.recipe.nutrition,
        servings: item.recipe.servings,
      }),
    };
  });

  const analysis = generateMealPlanAnalysis({
    dishes,
    pantryItems: pantry.items,
    budget: mealPlan.budget ?? undefined,
    peopleCount: mealPlan.peopleCount,
  });

    return {
    mealPlan: {
      id: mealPlan.id,
      name: mealPlan.name,
      peopleCount: mealPlan.peopleCount,
      budget: mealPlan.budget,
    },
    pantry: {
      id: pantry.id,
      name: pantry.name,
      ...analysis.pantry,
    },
    dishes: analysis.dishes,
    grocery: analysis.grocery,
    budget: analysis.budget,
    nutrition: analysis.nutrition,
  };
};

const getGroceryRequirementKey = ({
  name,
  unit,
}) =>
  `${name.trim().toLowerCase()}::${unit
    .trim()
    .toLowerCase()}`;

export const getMealPlanGroceryRequirements = async ({
  userId,
  mealPlanId,
  pantryId,
}) => {
  const evaluation = await evaluateMealPlan({
    userId,
    mealPlanId,
    pantryId,
  });

  const sourceDishIdsByRequirement = new Map();

  for (const dish of evaluation.dishes) {
    for (const ingredient of dish.missingIngredients) {
      const key = getGroceryRequirementKey(ingredient);

      if (!sourceDishIdsByRequirement.has(key)) {
        sourceDishIdsByRequirement.set(key, new Set());
      }

      sourceDishIdsByRequirement.get(key).add(dish.dishId);
    }
  }

  return {
    items: evaluation.grocery.items.map((item) => ({
      ...item,
      sourceDishIds: Array.from(
        sourceDishIdsByRequirement.get(
          getGroceryRequirementKey(item)
        ) ?? []
      ),
    })),
  };
};