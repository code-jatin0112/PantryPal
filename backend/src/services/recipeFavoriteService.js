import prisma from "../config/database.js";

export const addRecipeFavorite = async ({
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
    return {
      type: "RECIPE_NOT_FOUND",
      data: null,
    };
  }

  const existingFavorite = await prisma.recipeFavorite.findUnique({
    where: {
      userId_recipeId: {
        userId,
        recipeId,
      },
    },
  });

  if (existingFavorite) {
    return {
      type: "ALREADY_FAVORITED",
      data: existingFavorite,
    };
  }

  const favorite = await prisma.recipeFavorite.create({
    data: {
      userId,
      recipeId,
    },
    include: {
      recipe: {
        select: {
          id: true,
          title: true,
          description: true,
          prepTime: true,
          cookTime: true,
          servings: true,
        },
      },
    },
  });

  return {
    type: "CREATED",
    data: favorite,
  };
};

export const getFavoriteRecipes = async ({
  userId,
}) => {
  return prisma.recipeFavorite.findMany({
    where: {
      userId,
      recipe: {
        userId,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      recipe: {
        select: {
          id: true,
          title: true,
          description: true,
          prepTime: true,
          cookTime: true,
          servings: true,
        },
      },
    },
  });
};

export const removeRecipeFavorite = async ({
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
    return {
      type: "RECIPE_NOT_FOUND",
      data: null,
    };
  }

  const favorite = await prisma.recipeFavorite.findUnique({
    where: {
      userId_recipeId: {
        userId,
        recipeId,
      },
    },
  });

  if (!favorite) {
    return {
      type: "FAVORITE_NOT_FOUND",
      data: null,
    };
  }

  await prisma.recipeFavorite.delete({
    where: {
      userId_recipeId: {
        userId,
        recipeId,
      },
    },
  });

  return {
    type: "SUCCESS",
    data: true,
  };
};

export const isRecipeFavorited = async ({
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
    return {
      type: "RECIPE_NOT_FOUND",
      data: null,
    };
  }

  const favorite = await prisma.recipeFavorite.findUnique({
    where: {
      userId_recipeId: {
        userId,
        recipeId,
      },
    },
  });

  return {
    type: "SUCCESS",
    data: Boolean(favorite),
  };
};
