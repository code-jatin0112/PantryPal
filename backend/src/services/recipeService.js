import prisma from "../config/database.js";

export const createRecipe = async ({
  userId,
  title,
  description,
  instructions,
  prepTime,
  cookTime,
  servings,
}) => {
  return prisma.recipe.create({
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
};

export const getRecipes = async ({ userId }) => {
  return prisma.recipe.findMany({
    where: {
      userId,
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

  return prisma.recipe.update({
    where: {
      id: recipeId,
    },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(instructions !== undefined && { instructions }),
      ...(prepTime !== undefined && { prepTime }),
      ...(cookTime !== undefined && { cookTime }),
      ...(servings !== undefined && { servings }),
    },
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
