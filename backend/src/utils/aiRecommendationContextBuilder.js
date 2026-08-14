const normalizeItem = (item) => ({
  name: item.name,
  quantity: item.quantity,
  unit: item.unit,
  expiryDate: item.expiryDate
    ? item.expiryDate.toISOString().split("T")[0]
    : null,
});

const normalizeRecipe = (recipe) => ({
  id: recipe.id,
  title: recipe.title,
  description: recipe.description,
  prepTime: recipe.prepTime,
  cookTime: recipe.cookTime,
  servings: recipe.servings,
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
      dietaryRequirements:
        preferences.dietaryRequirements ?? [],
      mealType: preferences.mealType ?? null,
      maxPrepTime: preferences.maxPrepTime ?? null,
      budgetPriority: preferences.budgetPriority ?? null,
      additionalNotes:
        preferences.additionalNotes ?? null,
    },
  };
};

export const buildAIRecommendationPrompt = ({
  context,
}) => {
  return `
Generate meal recommendations for PantryPal.

Use the provided context as the only source of truth.

CONTEXT:
${JSON.stringify(context, null, 2)}

REQUIREMENTS:

1. Prefer recipes that use ingredients already available
   in the pantry.

2. Consider pantry quantities when making recommendations.

3. Prioritize ingredients that may expire sooner.

4. Respect the meal plan's peopleCount and budget when
   those values are provided.

5. Respect dietary requirements and user preferences.

6. Prefer recipes from the provided recipe list when suitable.

7. Do not claim that an ingredient exists in the pantry unless
   it appears in the provided pantry items.

8. Do not invent pantry quantities.

9. If additional ingredients are required, clearly identify them.

10. Prefer practical recommendations over unrealistic or
    unnecessarily complex recipes.

11. Return only the structured response requested by the schema.
  `.trim();
};
