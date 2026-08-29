const sanitizeString = (str) => {
  if (typeof str !== "string") return "";
  // Strip control characters and excessive whitespace while preserving text
  return str.replace(/[\x00-\x1F\x7F]/g, "").trim();
};

export const buildAIChatContext = ({
  pantries = [],
  recipes = [],
  mealPlans = [],
  shoppingItems = [],
  preferences = null,
}) => {
  const now = new Date();

  const allPantryItems = pantries.flatMap((pantry) =>
    (pantry.items ?? []).map((item) => {
      let isExpiringSoon = false;
      let isExpired = false;

      if (item.expiryDate) {
        const expiry = new Date(item.expiryDate);
        const days = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (days < 0) {
          isExpired = true;
        } else if (days <= 7) {
          isExpiringSoon = true;
        }
      }

      return {
        pantryName: pantry.name,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category ?? null,
        expiryDate: item.expiryDate
          ? item.expiryDate.toISOString().split("T")[0]
          : null,
        isExpiringSoon,
        isExpired,
      };
    })
  );

  const formattedRecipes = recipes.map((recipe) => ({
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
  }));

  const formattedMealPlans = mealPlans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    startDate: plan.startDate,
    endDate: plan.endDate,
    peopleCount: plan.peopleCount,
    budget: plan.budget,
    dishes: (plan.items ?? []).map((dish) => ({
      recipeId: dish.recipeId,
      plannedDate: dish.plannedDate,
      mealType: dish.mealType,
      requestedServings: dish.requestedServings,
    })),
  }));

  const formattedShoppingList = shoppingItems.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
  }));

  return {
    pantryInventory: allPantryItems,
    savedRecipes: formattedRecipes,
    activeMealPlans: formattedMealPlans,
    activeShoppingList: formattedShoppingList,
    userPreferences: {
      dietaryPreferences: preferences?.dietaryPreferences ?? [],
      allergies: preferences?.allergies ?? [],
      dislikedIngredients: preferences?.dislikedIngredients ?? [],
      defaultServings: preferences?.defaultServings ?? 2,
      maxCookingMinutes: preferences?.maxCookingMinutes ?? null,
      defaultBudget: preferences?.defaultBudget ?? null,
    },
  };
};

export const buildAIChatPrompt = ({
  context,
  message,
  conversationHistory = [],
}) => {
  const sanitizedMessage = sanitizeString(message);

  // Take the most recent 10 messages from history to prevent context explosion
  const recentHistory = (Array.isArray(conversationHistory) ? conversationHistory : [])
    .slice(-10)
    .map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: sanitizeString(msg.content),
    }))
    .filter((msg) => msg.content.length > 0);

  return `
You are PantryPal's intelligent Conversational Kitchen Assistant.
You assist users with cooking guidance, pantry inventory tracking, recipe suggestions, ingredient substitutions, and meal planning.

CURRENT USER APPLICATION DATA (Ground Truth):
${JSON.stringify(context, null, 2)}

RECENT CONVERSATION HISTORY:
${JSON.stringify(recentHistory, null, 2)}

CURRENT USER INQUIRY:
"${sanitizedMessage}"

CORE INSTRUCTIONS:
1. Ground all answers strictly in the user's provided application data.
2. If the user asks about ingredients or stock, check the pantryInventory. Do not guess or invent items not present.
3. If an ingredient is expiring soon (isExpiringSoon = true) or expired (isExpired = true), mention it when relevant.
4. STRICT ALLERGY SAFETY: Never recommend or approve an ingredient that matches the user's allergies or dietary restrictions. Always provide an explicit warning if an ingredient could pose an allergy risk.
5. If the user asks for cooking guidance, substitutions, or recipes, provide practical, step-by-step, and concise advice.
6. Provide helpful suggestedActions (e.g. "Add to shopping list", "View recipe").
7. Return only the structured JSON response matching the schema.
  `.trim();
};
