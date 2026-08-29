import prisma from "../config/database.js";
import { generateStructuredAIResponse } from "./aiService.js";
import { aiChatResponseSchema } from "../schemas/aiChatSchema.js";
import {
  buildAIChatContext,
  buildAIChatPrompt,
} from "../utils/aiChatContextBuilder.js";

export const chatWithKitchenAssistant = async ({
  userId,
  message,
  conversationHistory = [],
}) => {
  const [
    pantries,
    recipes,
    mealPlans,
    shoppingItems,
    userPreference,
  ] = await Promise.all([
    prisma.pantry.findMany({
      where: { userId },
      include: {
        items: {
          orderBy: { name: "asc" },
        },
      },
    }),
    prisma.recipe.findMany({
      where: { userId },
      include: {
        ingredients: true,
      },
      orderBy: { title: "asc" },
    }),
    prisma.mealPlan.findMany({
      where: { userId },
      include: {
        items: {
          orderBy: { plannedDate: "asc" },
        },
      },
      orderBy: { startDate: "desc" },
      take: 5,
    }),
    prisma.shoppingListItem.findMany({
      where: {
        userId,
        isPurchased: false,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.userPreference
      ? prisma.userPreference.findUnique({
          where: { userId },
        }).catch(() => null)
      : null,
  ]);

  const context = buildAIChatContext({
    pantries,
    recipes,
    mealPlans,
    shoppingItems,
    preferences: userPreference,
  });

  const prompt = buildAIChatPrompt({
    context,
    message,
    conversationHistory,
  });

  const response = await generateStructuredAIResponse({
    systemInstruction: `
You are PantryPal's intelligent Conversational Kitchen Assistant.
Your role is to help users manage their pantry, find meal ideas, avoid food waste, follow safe dietary practices, and cook delicious meals.

Core Principles:
- Rely strictly on the user's pantry and application data provided in the prompt.
- Never invent pantry items or ingredients.
- Strictly enforce allergy safety and dietary preferences.
- Provide clear, actionable, concise, and friendly guidance.
- Return structured JSON matching the provided schema.
    `.trim(),
    prompt,
    responseSchema: aiChatResponseSchema,
  });

  return {
    reply: response.reply,
    intent: response.intent,
    relevantItems: response.relevantItems ?? [],
    suggestedActions: response.suggestedActions ?? [],
    warnings: response.warnings ?? [],
    contextSummary: {
      pantryCount: pantries.length,
      totalPantryItems: pantries.reduce(
        (acc, p) => acc + (p.items?.length || 0),
        0
      ),
      recipeCount: recipes.length,
      activeMealPlans: mealPlans.length,
      shoppingItemCount: shoppingItems.length,
    },
  };
};
