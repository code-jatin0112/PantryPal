const normalizeItem = (item) => {
  let isExpiringSoon = false;
  if (item.expiryDate) {
    const now = new Date();
    const expiry = new Date(item.expiryDate);
    const daysUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    isExpiringSoon = daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
  }

  return {
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    expiryDate: item.expiryDate
      ? item.expiryDate.toISOString().split("T")[0]
      : null,
    isExpiringSoon,
  };
};

const normalizeRecipe = (recipe) => ({
  id: recipe.id,
  title: recipe.title,
  description: recipe.description,
  prepTime: recipe.prepTime,
  cookTime: recipe.cookTime,
  servings: recipe.servings,
  ingredients: (recipe.ingredients ?? []).map((ing) => ({
    name: ing.name,
    quantity: ing.quantity,
    unit: ing.unit,
  })),
});

export const buildAIRecommendationContext = ({
  pantry,
  recipes = [],
  mealPlan,
  preferences = {},
}) => {
  if (!pantry) {
    throw new Error("Pantry is required");
  }

  return {
    pantry: {
      id: pantry.id,
      name: pantry.name,
      items: (pantry.items ?? []).map(normalizeItem),
    },

    recipes: recipes.map(normalizeRecipe),

    mealPlan: mealPlan
      ? {
          id: mealPlan.id,
          name: mealPlan.name,
          startDate: mealPlan.startDate,
          endDate: mealPlan.endDate,
          peopleCount: mealPlan.peopleCount,
          budget: mealPlan.budget,
          dishes: (mealPlan.items ?? []).map((item) => ({
            recipeId: item.recipeId,
            plannedDate: item.plannedDate,
            mealType: item.mealType,
            requestedServings: item.requestedServings,
          })),
        }
      : null,

    preferences: {
      cuisine: preferences.cuisine ?? null,
      dietaryRequirements: preferences.dietaryRequirements ?? [],
      allergies: preferences.allergies ?? [],
      dislikedIngredients: preferences.dislikedIngredients ?? [],
      mealType: preferences.mealType ?? null,
      maxPrepTime: preferences.maxPrepTime ?? null,
      budgetPriority: preferences.budgetPriority ?? null,
      servings: preferences.servings ?? null,
      additionalNotes: preferences.additionalNotes ?? null,
    },
  };
};

export const buildAIRecommendationPrompt = ({ context }) => {
  const hasRecipes = context.recipes && context.recipes.length > 0;

  return `
Generate meal recommendations for PantryPal.

Use the provided context as the source of truth.

CONTEXT:
${JSON.stringify(context, null, 2)}

REQUIREMENTS:

1. Prefer recipes that use ingredients already available in the pantry.
2. Consider pantry quantities when making recommendations.
3. Prioritize ingredients where isExpiringSoon is true to reduce food waste.
4. Respect the meal plan's peopleCount and budget when those values are provided.
5. Respect dietary requirements, strictly avoid all ingredients in allergies and dislikedIngredients.
6. ${hasRecipes
      ? "Prefer matching recipes from the provided recipe list when suitable, or generate creative recipes if existing ones don't match."
      : "The user has no saved recipes. Generate new, creative recipe recommendations from scratch that maximize available pantry items (use 'generated-1', 'generated-2', etc. as recipeId)."
    }
7. Do not claim that an ingredient exists in the pantry unless it appears in the provided pantry items.
8. Do not invent pantry quantities.
9. If additional ingredients are required, clearly identify them in missingIngredients.
10. For missing ingredients, suggest substitutions where possible.
11. Keep matchScore between 0 and 100 based on pantry availability and preference alignment.
12. Keep pantryUsage.percentage between 0 and 100.
13. Return only the structured response requested by the schema.
  `.trim();
};
