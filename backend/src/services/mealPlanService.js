import prisma from "../config/database.js";

export const createMealPlan = async ({
  userId,
  recipeId,
  date,
  mealType,
  notes,
}) => {
  const recipe = await prisma.recipe.findFirst({
    where: {
      id: recipeId,
      userId,
    },
  });

  if (!recipe) {
    return null;
  }

  return prisma.mealPlan.create({
    data: {
      userId,
      recipeId,
      date,
      mealType,
      notes,
    },
    include: {
      recipe: {
        select: {
          id: true,
          title: true,
          prepTime: true,
          cookTime: true,
          servings: true,
        },
      },
    },
  });
};

export const getMealPlans = async ({
  userId,
  startDate,
  endDate,
  mealType,
}) => {
  return prisma.mealPlan.findMany({
    where: {
      userId,
      ...(mealType !== undefined && {
        mealType,
      }),
      ...(startDate !== undefined &&
        endDate !== undefined && {
          date: {
            gte: startDate,
            lte: endDate,
          },
        }),
    },
    orderBy: [
      {
        date: "asc",
      },
      {
        mealType: "asc",
      },
    ],
    include: {
      recipe: {
        select: {
          id: true,
          title: true,
          prepTime: true,
          cookTime: true,
          servings: true,
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
      recipe: {
        select: {
          id: true,
          title: true,
          description: true,
          instructions: true,
          prepTime: true,
          cookTime: true,
          servings: true,
        },
      },
    },
  });
};

export const updateMealPlan = async ({
  userId,
  mealPlanId,
  recipeId,
  date,
  mealType,
  notes,
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

  if (recipeId !== undefined) {
    const recipe = await prisma.recipe.findFirst({
      where: {
        id: recipeId,
        userId,
      },
    });

    if (!recipe) {
      return null;
    }
  }

  return prisma.mealPlan.update({
    where: {
      id: mealPlanId,
    },
    data: {
      ...(recipeId !== undefined && { recipeId }),
      ...(date !== undefined && { date }),
      ...(mealType !== undefined && { mealType }),
      ...(notes !== undefined && { notes }),
    },
    include: {
      recipe: {
        select: {
          id: true,
          title: true,
          prepTime: true,
          cookTime: true,
          servings: true,
        },
      },
    },
  });
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