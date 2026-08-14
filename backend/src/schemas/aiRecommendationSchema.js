export const aiRecommendationResponseSchema = {
  type: "object",

  properties: {
    recommendations: {
      type: "array",

      items: {
        type: "object",

        properties: {
          recipeId: {
            type: "string",
          },

          title: {
            type: "string",
          },

          reason: {
            type: "string",
          },

          matchScore: {
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

          estimatedCost: {
            type: "number",
          },

          pantryUsage: {
            type: "object",

            properties: {
              percentage: {
                type: "number",
              },

              usedIngredients: {
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
            },

            required: [
              "percentage",
              "usedIngredients",
              "missingIngredients",
            ],
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

              required: [
                "ingredient",
                "substitute",
                "reason",
              ],
            },
          },

          warnings: {
            type: "array",

            items: {
              type: "string",
            },
          },
        },

        required: [
          "recipeId",
          "title",
          "reason",
          "matchScore",
          "servings",
          "prepTime",
          "cookTime",
          "estimatedCost",
          "pantryUsage",
          "substitutions",
          "warnings",
        ],
      },
    },
  },

  required: [
    "recommendations",
  ],
};
