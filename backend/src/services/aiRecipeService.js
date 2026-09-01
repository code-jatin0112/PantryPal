import prisma from "../config/database.js";
import AppError from "../utils/AppError.js";

import {
  generateStructuredAIResponse,
} from "./aiService.js";

import {
  aiRecipeResponseSchema,
} from "../schemas/aiRecipeSchema.js";

import {
  buildPantryContext,
  buildRecipeGenerationPrompt,
} from "../utils/aiContextBuilder.js";
import { UnstructuredRecipe } from "../models/UnstructuredRecipe.js";

export const generateRecipeFromPantry = async ({
  userId,
  pantryId,
  servings,
  budget,
  preferences,
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

  const pantryContext = buildPantryContext(pantry);

  const prompt = buildRecipeGenerationPrompt({
    pantryContext,
    servings,
    budget,
    preferences,
  });

  const recipe = await generateStructuredAIResponse({
    systemInstruction: `
You are PantryPal's recipe generation assistant.

Your job is to generate practical recipes based on the
user's pantry contents.

Important rules:
- Prefer ingredients that are actually present in the pantry.
- Respect the quantities available in the pantry.
- Never claim an ingredient is available unless it exists
  in the provided pantry context.
- Put unavailable ingredients in missingIngredients.
- Suggest useful substitutions when appropriate.
- Do not modify, deduct, or otherwise change pantry data.
- Generate realistic quantities and cooking instructions.
- If a budget is provided, keep the estimated recipe cost within that budget.
- Return the estimated cost as a numeric value in the same currency context as the budget.
- Return only the structured response matching the schema.
    `.trim(),

    prompt,

    responseSchema: aiRecipeResponseSchema,
  });

  if (
    budget !== undefined &&
    recipe.estimatedCost > budget
  ) {
    throw new AppError(
      "Generated recipe exceeds the requested budget",
      422,
      "RECIPE_BUDGET_EXCEEDED"
    );
  }

  // Persist unstructured recipe generation into MongoDB (NoSQL)
  try {
    await UnstructuredRecipe.create({
      userId,
      sourcePrompt: preferences || "Pantry Recipe Generation",
      rawOutput: recipe,
      conversionStatus: "NORMALIZED",
    });
  } catch (mongoErr) {
    console.warn("MongoDB unstructured recipe save skipped:", mongoErr.message);
  }

  return {
    pantry: {
      id: pantry.id,
      name: pantry.name,
    },
    recipe,
  };
};

export const getUnstructuredRecipes = async (userId) => {
  return await UnstructuredRecipe.find({ userId }).sort({ createdAt: -1 });
};

export const deleteUnstructuredRecipe = async (recipeId, userId) => {
  return await UnstructuredRecipe.findOneAndDelete({ _id: recipeId, userId });
};