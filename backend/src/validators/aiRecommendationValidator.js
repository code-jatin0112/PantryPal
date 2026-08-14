import { body } from "express-validator";

export const generateAIRecommendationsValidation = [
  body("pantryId")
    .isUUID()
    .withMessage("Pantry ID must be a valid UUID"),

  body("mealPlanId")
    .optional()
    .isUUID()
    .withMessage("Meal plan ID must be a valid UUID"),

  body("cuisine")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Cuisine must not exceed 50 characters"),

  body("dietaryRequirements")
    .optional()
    .isArray()
    .withMessage(
      "Dietary requirements must be an array"
    ),

  body("mealType")
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage("Meal type must not exceed 30 characters"),

  body("maxPrepTime")
    .optional()
    .isInt({ min: 1 })
    .withMessage(
      "Maximum prep time must be a positive integer"
    ),

  body("budgetPriority")
    .optional()
    .trim()
    .isIn(["low", "medium", "high"])
    .withMessage(
      "Budget priority must be low, medium, or high"
    ),

  body("additionalNotes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage(
      "Additional notes must not exceed 500 characters"
    ),
];
