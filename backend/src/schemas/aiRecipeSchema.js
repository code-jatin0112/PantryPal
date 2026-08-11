export const aiRecipeResponseSchema = {
  type: "object",
  properties: {
    title: {
      type: "string",
    },
    description: {
      type: "string",
    },
    estimatedCost: {
      type: "number",
    },
    servings: {
      type: "integer",
    },
    prepTime: {
      type: "integer",
    },
    cookTime: {
      type: "integer",
    },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
          },
          quantity: {
            type: "number",
          },
          unit: {
            type: "string",
          },
        },
        required: ["name", "quantity", "unit"],
      },
    },
    instructions: {
      type: "array",
      items: {
        type: "string",
      },
    },
    missingIngredients: {
      type: "array",
      items: {
        type: "string",
      },
    },
    substitutions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          ingredient: {
            type: "string",
          },
          substitute: {
            type: "string",
          },
          reason: {
            type: "string",
          },
        },
        required: ["ingredient", "substitute", "reason"],
      },
    },
  },
  required: [
    "title",
    "description",
    "estimatedCost",
    "servings",
    "prepTime",
    "cookTime",
    "ingredients",
    "instructions",
    "missingIngredients",
    "substitutions",
  ],
};