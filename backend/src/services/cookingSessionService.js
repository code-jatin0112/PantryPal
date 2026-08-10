import prisma from "../config/database.js";
import AppError from "../utils/AppError.js";

const getRecipeWithOwnership = async ({
  userId,
  recipeId,
}) => {
  const recipe = await prisma.recipe.findFirst({
    where: {
      id: recipeId,
      userId,
    },
    include: {
      ingredients: true,
    },
  });

  if (!recipe) {
    throw new AppError(
      "Recipe not found",
      404,
      "RECIPE_NOT_FOUND"
    );
  }

  return recipe;
};

export const startCookingSession = async ({
  userId,
  recipeId,
  servings,
}) => {
  const recipe = await getRecipeWithOwnership({
    userId,
    recipeId,
  });

  if (recipe.ingredients.length === 0) {
    throw new AppError(
      "Recipe has no ingredients",
      400,
      "RECIPE_HAS_NO_INGREDIENTS"
    );
  }

  const activeSession = await prisma.cookingSession.findFirst({
    where: {
      userId,
      recipeId,
      status: "active",
    },
  });

  if (activeSession) {
    throw new AppError(
      "An active cooking session already exists for this recipe",
      409,
      "ACTIVE_COOKING_SESSION_EXISTS"
    );
  }

  const totalSteps = recipe.instructions
    .split(/\r?\n/)
    .map((step) => step.trim())
    .filter(Boolean).length || 1;

  return prisma.cookingSession.create({
    data: {
      userId,
      recipeId,
      servings,
      status: "active",
      currentStep: 1,
      totalSteps,
    },
    include: {
      recipe: true,
    },
  });
};

export const getCookingSession = async ({
  userId,
  sessionId,
}) => {
  const session = await prisma.cookingSession.findFirst({
    where: {
      id: sessionId,
      userId,
    },
    include: {
      recipe: {
        include: {
          ingredients: true,
        },
      },
    },
  });

  if (!session) {
    throw new AppError(
      "Cooking session not found",
      404,
      "COOKING_SESSION_NOT_FOUND"
    );
  }

  return session;
};

export const updateCookingProgress = async ({
  userId,
  sessionId,
  currentStep,
}) => {
  const session = await prisma.cookingSession.findFirst({
    where: {
      id: sessionId,
      userId,
    },
  });

  if (!session) {
    throw new AppError(
      "Cooking session not found",
      404,
      "COOKING_SESSION_NOT_FOUND"
    );
  }

  if (session.status === "completed") {
    throw new AppError(
      "Cooking session is already completed",
      409,
      "COOKING_SESSION_COMPLETED"
    );
  }

  if (currentStep > session.totalSteps) {
    throw new AppError(
      "Current step cannot exceed total steps",
      400,
      "INVALID_COOKING_STEP"
    );
  }

  return prisma.cookingSession.update({
    where: {
      id: sessionId,
    },
    data: {
      currentStep,
    },
  });
};