export const aiChatResponseSchema = {
  type: "object",
  properties: {
    reply: {
      type: "string",
      description:
        "The helpful, concise, context-grounded conversational response to the user.",
    },
    intent: {
      type: "string",
      enum: [
        "pantry_query",
        "recipe_query",
        "cooking_guidance",
        "substitution",
        "meal_suggestion",
        "grocery_advice",
        "general",
      ],
      description: "The identified intent of the user's inquiry.",
    },
    relevantItems: {
      type: "array",
      items: {
        type: "string",
      },
      description:
        "Names of pantry items or recipe ingredients referenced in the reply.",
    },
    suggestedActions: {
      type: "array",
      items: {
        type: "string",
      },
      description:
        "Actionable next steps suggested to the user.",
    },
    warnings: {
      type: "array",
      items: {
        type: "string",
      },
      description:
        "Allergy warnings, expiry warnings, or dietary alerts relevant to the conversation.",
    },
  },
  required: [
    "reply",
    "intent",
    "relevantItems",
    "suggestedActions",
    "warnings",
  ],
};
