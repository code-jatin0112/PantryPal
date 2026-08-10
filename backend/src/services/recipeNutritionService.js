import prisma from "../config/database.js";

export const createRecipeNutrition = async ({
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

  return prisma.recipeNutrition.create({
    data: {
      recipeId,
      calories,
      protein,
      carbohydrates,
      fat,
      fiber,
      sugar,
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
    return null;
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
    return null;
  }

  await prisma.recipeNutrition.delete({
    where: {
      recipeId,
    },
  });

  return true;
};