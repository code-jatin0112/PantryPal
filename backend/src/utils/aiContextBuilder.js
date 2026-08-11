export const buildPantryContext = (pantry) => {
  if (!pantry) {
    return {
      pantry: null,
      items: [],
    };
  }

  return {
    pantry: {
      id: pantry.id,
      name: pantry.name,
    },
    items: pantry.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      expiryDate: item.expiryDate
        ? item.expiryDate.toISOString().split("T")[0]
        : null,
    })),
  };
};

export const buildRecipeGenerationPrompt = ({
  pantryContext,
  servings,
  preferences,
}) => {
  return `
Generate a practical recipe using the user's pantry.

Pantry:
${JSON.stringify(pantryContext, null, 2)}

Requested servings:
${servings ?? "Use a reasonable serving size"}

User preferences:
${preferences || "None provided"}

Requirements:
- Prefer ingredients already available in the pantry.
- Clearly identify ingredients that are missing.
- Suggest practical substitutions when appropriate.
- Do not invent pantry quantities.
- Do not modify pantry data.
- Keep ingredient quantities realistic.
- Return only the structured recipe response.
  `.trim();
};