import prisma from "../config/database.js";

export const createRecipeNutrition = async ({
  userId,
  recipeId,
  calories,
  protein,
  carbohydrates,
  fat,
  fiber = 0,
  sugar = 0,
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

  // Check if nutrition already exists to prevent duplicate creation (Prisma P2002)
  const existing = await prisma.recipeNutrition.findUnique({
    where: {
      recipeId,
    },
  });

  if (existing) {
    const error = new Error("Nutrition information already exists for this recipe");
    error.statusCode = 409;
    error.code = "RECIPE_NUTRITION_EXISTS";
    throw error;
  }

  return prisma.recipeNutrition.create({
    data: {
      recipeId,
      calories: calories ?? 0,
      protein: protein ?? 0,
      carbohydrates: carbohydrates ?? 0,
      fat: fat ?? 0,
      fiber: fiber ?? 0,
      sugar: sugar ?? 0,
    },
  });
};

export const getRecipeNutrition = async ({
  userId,
  recipeId,
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

  const nutrition = await prisma.recipeNutrition.findUnique({
    where: {
      recipeId,
    },
  });

  if (!nutrition) {
    return undefined;
  }

  return nutrition;
};

export const updateRecipeNutrition = async ({
  userId,
  recipeId,
  calories,
  protein,
  carbohydrates,
  fat,
  fiber,
  sugar,
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

  const nutrition = await prisma.recipeNutrition.findUnique({
    where: {
      recipeId,
    },
  });

  if (!nutrition) {
    return undefined;
  }

  return prisma.recipeNutrition.update({
    where: {
      recipeId,
    },
    data: {
      ...(calories !== undefined && { calories }),
      ...(protein !== undefined && { protein }),
      ...(carbohydrates !== undefined && { carbohydrates }),
      ...(fat !== undefined && { fat }),
      ...(fiber !== undefined && { fiber }),
      ...(sugar !== undefined && { sugar }),
    },
  });
};

export const deleteRecipeNutrition = async ({
  userId,
  recipeId,
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

  const nutrition = await prisma.recipeNutrition.findUnique({
    where: {
      recipeId,
    },
  });

  if (!nutrition) {
    return undefined;
  }

  await prisma.recipeNutrition.delete({
    where: {
      recipeId,
    },
  });

  return true;
};