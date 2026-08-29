import prisma from "../config/database.js";
import AppError from "../utils/AppError.js";
import { generateStructuredAIResponse } from "./aiService.js";
import { aiRecommendationResponseSchema } from "../schemas/aiRecommendationSchema.js";
import {
  buildAIRecommendationContext,
  buildAIRecommendationPrompt,
} from "../utils/aiRecommendationContextBuilder.js";

export const generateAIRecommendations = async ({
  userId,
  pantryId,
  mealPlanId,
  preferences = {},
}) => {
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

  if (pantry.items.length === 0) {
    throw new AppError(
      "Pantry has no items",
      400,
      "PANTRY_HAS_NO_ITEMS"
    );
  }

  let mealPlan = null;

  if (mealPlanId) {
    mealPlan = await prisma.mealPlan.findFirst({
      where: {
        id: mealPlanId,
        userId,
      },
      include: {
        items: {
          orderBy: {
            plannedDate: "asc",
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
  }

  let userPreference = null;
  if (prisma.userPreference) {
    userPreference = await prisma.userPreference.findUnique({
      where: { userId },
    }).catch(() => null);
  }

  const mergedPreferences = {
    cuisine: preferences.cuisine ?? null,
    dietaryRequirements: [
      ...new Set([
        ...(userPreference?.dietaryPreferences ?? []),
        ...(preferences.dietaryRequirements ?? []),
      ]),
    ],
    allergies: [
      ...new Set([
        ...(userPreference?.allergies ?? []),
        ...(preferences.allergies ?? []),
      ]),
    ],
    dislikedIngredients: [
      ...new Set([
        ...(userPreference?.dislikedIngredients ?? []),
        ...(preferences.dislikedIngredients ?? []),
      ]),
    ],
    mealType: preferences.mealType ?? null,
    maxPrepTime:
      preferences.maxPrepTime ??
      userPreference?.maxCookingMinutes ??
      null,
    budgetPriority:
      preferences.budgetPriority ??
      (userPreference?.defaultBudget ? "medium" : null),
    servings:
      preferences.servings ??
      userPreference?.defaultServings ??
      null,
    additionalNotes: preferences.additionalNotes ?? null,
  };

  const recipes = await prisma.recipe.findMany({
    where: {
      userId,
    },
    orderBy: {
      title: "asc",
    },
    include: {
      ingredients: true,
    },
  });

  const context = buildAIRecommendationContext({
    pantry,
    recipes,
    mealPlan,
    preferences: mergedPreferences,
  });

  const prompt = buildAIRecommendationPrompt({
    context,
  });

  const response = await generateStructuredAIResponse({
    systemInstruction: `
You are PantryPal's AI meal recommendation assistant.
Your job is to recommend practical, delicious, and waste-reducing recipes using the provided pantry context.

Rules:
- Maximize the use of available pantry items.
- Strictly honor dietary restrictions, allergies, and disliked ingredients.
- Prioritize ingredients that are expiring soon to reduce waste.
- Provide realistic matchScore and pantryUsage percentages (0-100).
- Accurately list usedIngredients and missingIngredients.
- Provide estimated costs for any missing ingredients.
- Return structured JSON matching the provided schema.
    `.trim(),
    prompt,
    responseSchema: aiRecommendationResponseSchema,
  });

  return {
    pantry: {
      id: pantry.id,
      name: pantry.name,
    },
    mealPlan: mealPlan
      ? {
          id: mealPlan.id,
          name: mealPlan.name,
        }
      : null,
    preferences: mergedPreferences,
    recommendations: response.recommendations ?? [],
  };
};
