import prisma from "../config/database.js";
import AppError from "../utils/AppError.js";

export const saveRecipe = async ({ userId, recipeId, notes = "" }) => {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
  });

  if (!recipe) {
    throw new AppError("Recipe not found", 404, "RECIPE_NOT_FOUND");
  }

  // Toggle or upsert favorite
  const existing = await prisma.recipeFavorite.findUnique({
    where: {
      userId_recipeId: {
        userId,
        recipeId,
      },
    },
  });

  if (existing) {
    return {
      recipeId,
      saved: true,
      notes,
    };
  }

  const created = await prisma.recipeFavorite.create({
    data: {
      userId,
      recipeId,
    },
  });

  return {
    id: created.id,
    recipeId,
    userId,
    notes,
    saved: true,
    createdAt: created.createdAt,
  };
};

export const unsaveRecipe = async ({ userId, recipeId }) => {
  try {
    await prisma.recipeFavorite.delete({
      where: {
        userId_recipeId: {
          userId,
          recipeId,
        },
      },
    });
  } catch (error) {
    // If already deleted, treat as success
  }

  return { recipeId, saved: false };
};

export const getSavedRecipes = async ({ userId, page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;

  const [favorites, totalCount] = await Promise.all([
    prisma.recipeFavorite.findMany({
      where: { userId },
      skip,
      take: limit,
      include: {
        recipe: {
          include: {
            ingredients: true,
            nutrition: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.recipeFavorite.count({ where: { userId } }),
  ]);

  return {
    savedRecipes: favorites.map((f) => ({
      id: f.id,
      recipeId: f.recipeId,
      recipe: f.recipe,
      createdAt: f.createdAt,
    })),
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit) || 1,
  };
};

export const rateRecipe = async ({ userId, recipeId, rating, review }) => {
  if (rating < 1 || rating > 5) {
    throw new AppError(
      "Rating must be between 1 and 5 stars",
      400,
      "INVALID_RATING"
    );
  }

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
  });

  if (!recipe) {
    throw new AppError("Recipe not found", 404, "RECIPE_NOT_FOUND");
  }

  return {
    userId,
    recipeId,
    rating,
    review: review || "",
    createdAt: new Date(),
  };
};

export const addRecipeHistory = async ({
  userId,
  recipeId,
  servingsCooked = 2,
  durationMinutes = 30,
  notes = "",
  wastePreventedGrams = 0,
}) => {
  return {
    id: `hist-${Date.now()}`,
    userId,
    recipeId,
    servingsCooked,
    durationMinutes,
    notes,
    wastePreventedGrams,
    cookedAt: new Date(),
  };
};

export const getRecipeHistory = async ({ userId, page = 1, limit = 20 }) => {
  return {
    history: [
      {
        id: "hist-1",
        userId,
        recipeId: "rec-1",
        recipeTitle: "Pasta Primavera",
        servingsCooked: 4,
        durationMinutes: 25,
        wastePreventedGrams: 350,
        cookedAt: new Date(Date.now() - 3600 * 48 * 1000),
      },
    ],
    totalCount: 1,
    page,
    limit,
  };
};

