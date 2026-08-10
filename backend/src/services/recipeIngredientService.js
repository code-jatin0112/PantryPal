import prisma from "../config/database.js";

export const createRecipeIngredient = async ({
  userId,
  recipeId,
  name,
  quantity,
  unit,
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

  return prisma.recipeIngredient.create({
    data: {
      recipeId,
      name,
      quantity,
      unit,
    },
  });
};

export const getRecipeIngredients = async ({
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

  return prisma.recipeIngredient.findMany({
    where: {
      recipeId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
};

export const getRecipeIngredientById = async ({
  userId,
  recipeId,
  ingredientId,
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

  return prisma.recipeIngredient.findFirst({
    where: {
      id: ingredientId,
      recipeId,
    },
  });
};

export const updateRecipeIngredient = async ({
  userId,
  recipeId,
  ingredientId,
  name,
  quantity,
  unit,
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

  const ingredient = await prisma.recipeIngredient.findFirst({
    where: {
      id: ingredientId,
      recipeId,
    },
  });

  if (!ingredient) {
    return null;
  }

  return prisma.recipeIngredient.update({
    where: {
      id: ingredientId,
    },
    data: {
      ...(name !== undefined && { name }),
      ...(quantity !== undefined && { quantity }),
      ...(unit !== undefined && { unit }),
    },
  });
};

export const deleteRecipeIngredient = async ({
  userId,
  recipeId,
  ingredientId,
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

  const ingredient = await prisma.recipeIngredient.findFirst({
    where: {
      id: ingredientId,
      recipeId,
    },
  });

  if (!ingredient) {
    return null;
  }

  await prisma.recipeIngredient.delete({
    where: {
      id: ingredientId,
    },
  });

  return true;
};
