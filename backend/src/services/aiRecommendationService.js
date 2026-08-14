import prisma from "../config/database.js";
import AppError from "../utils/AppError.js";

import {
  generateStructuredAIResponse,
} from "./aiService.js";

import {
  aiRecommendationResponseSchema,
} from "../schemas/aiRecommendationSchema.js";

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

  const recipes = await prisma.recipe.findMany({
    where: {
      userId,
    },
    orderBy: {
      title: "asc",
    },
    select: {
      id: true,
      title: true,
      description: true,
      prepTime: true,
      cookTime: true,
      servings: true,
    },
  });

  if (recipes.length === 0) {
    throw new AppError(
      "No recipes available for recommendations",
      404,
      "NO_RECIPES_AVAILABLE"
    );
  }

  const context = buildAIRecommendationContext({
    pantry,
    recipes,
    mealPlan,
    preferences,
  });

  const prompt = buildAIRecommendationPrompt({
    context,
  });

  const recommendations =
    await generateStructuredAIResponse({
      systemInstruction: `
You are PantryPal's AI meal recommendation assistant.

Your job is to recommend practical recipes using the
provided PantryPal context.

Rules:

- Use only recipes provided in the context.
- Never invent recipe IDs.
- Prefer recipes that use pantry ingredients.
- Consider available pantry quantities.
- Prioritize ingredients approaching expiry.
- Respect meal plan budget when available.
- Respect dietary requirements and user preferences.
- Do not claim pantry ingredients that are not present.
- Do not invent pantry quantities.
- Clearly identify missing ingredients.
- Provide realistic estimated costs.
- Keep matchScore between 0 and 100.
- Keep pantryUsage.percentage between 0 and 100.
- Return only the structured response matching the schema.
      `.trim(),

      prompt,

      responseSchema:
        aiRecommendationResponseSchema,
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

    recommendations,
  };
};
