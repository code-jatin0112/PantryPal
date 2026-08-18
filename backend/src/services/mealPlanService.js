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

    return mealPlan;
  });
};

export const getMealPlans = async ({
  userId,
  startDate,
  endDate,
}) => {
  return prisma.mealPlan.findMany({
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
};

export const getMealPlanById = async ({
  userId,
  mealPlanId,
}) => {
  return prisma.mealPlan.findFirst({
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
};

export const updateMealPlan = async ({
  userId,
  mealPlanId,
  name,
  startDate,
  endDate,
  peopleCount,
  budget,
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

  return prisma.mealPlan.update({
    where: {
      id: mealPlanId,
    },
    data: {
      ...(name !== undefined && { name }),
      ...(startDate !== undefined && {
        startDate: new Date(startDate),
      }),
      ...(endDate !== undefined && {
        endDate: new Date(endDate),
      }),
      ...(peopleCount !== undefined && { peopleCount }),
      ...(budget !== undefined && { budget }),
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