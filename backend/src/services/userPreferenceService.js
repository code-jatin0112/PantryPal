import prisma from "../config/database.js";

export const getUserPreferences = async (userId) => {
  const prefs = await prisma.userPreference.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      dietaryPreferences: [],
      allergies: [],
      dislikedIngredients: [],
      defaultServings: 2,
      maxCookingMinutes: null,
      defaultBudget: null,
    },
  });

  return {
    ...prefs,
    dietaryRequirements: prefs.dietaryPreferences,
  };
};

export const updateUserPreferences = async (userId, data) => {
  const updateData = {};

  const inputDietary = data.dietaryPreferences !== undefined ? data.dietaryPreferences : data.dietaryRequirements;
  if (inputDietary !== undefined) {
    updateData.dietaryPreferences = Array.isArray(inputDietary)
      ? [...new Set(inputDietary.map((s) => (typeof s === "string" ? s.trim() : s)).filter(Boolean))]
      : [];
  }

  if (data.allergies !== undefined) {
    updateData.allergies = Array.isArray(data.allergies)
      ? [...new Set(data.allergies.map((s) => (typeof s === "string" ? s.trim() : s)).filter(Boolean))]
      : [];
  }

  if (data.dislikedIngredients !== undefined) {
    updateData.dislikedIngredients = Array.isArray(data.dislikedIngredients)
      ? [...new Set(data.dislikedIngredients.map((s) => (typeof s === "string" ? s.trim() : s)).filter(Boolean))]
      : [];
  }

  if (data.defaultServings !== undefined && data.defaultServings !== null) {
    updateData.defaultServings = data.defaultServings;
  }

  if (data.maxCookingMinutes !== undefined) {
    updateData.maxCookingMinutes = data.maxCookingMinutes ?? null;
  }

  if (data.defaultBudget !== undefined) {
    updateData.defaultBudget = data.defaultBudget ?? null;
  }

  const createData = {
    userId,
    dietaryPreferences: updateData.dietaryPreferences ?? [],
    allergies: updateData.allergies ?? [],
    dislikedIngredients: updateData.dislikedIngredients ?? [],
    defaultServings: updateData.defaultServings ?? 2,
    maxCookingMinutes: updateData.maxCookingMinutes ?? null,
    defaultBudget: updateData.defaultBudget ?? null,
  };

  const result = await prisma.userPreference.upsert({
    where: { userId },
    update: updateData,
    create: createData,
  });

  return {
    ...result,
    dietaryRequirements: result.dietaryPreferences,
  };
};
