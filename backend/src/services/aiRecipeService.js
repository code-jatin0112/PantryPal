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

export const generateRecipeFromPantry = async ({
  userId,
  pantryId,
  servings,
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
- Return only the structured response matching the schema.
    `.trim(),

    prompt,

    responseSchema: aiRecipeResponseSchema,
  });

  return {
    pantry: {
      id: pantry.id,
      name: pantry.name,
    },
    recipe,
  };
};