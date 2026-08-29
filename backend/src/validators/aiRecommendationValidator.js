import { body } from "express-validator";

export const generateAIRecommendationsValidation = [
  body("pantryId")
    .isUUID()
    .withMessage("Pantry ID must be a valid UUID"),

  body("mealPlanId")
    .optional({ nullable: true })
    .isUUID()
    .withMessage("Meal plan ID must be a valid UUID"),

  body("cuisine")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage("Cuisine must not exceed 50 characters"),

  body("dietaryRequirements")
    .optional({ nullable: false })
    .isArray()
    .withMessage("Dietary requirements must be an array of strings"),

  body("dietaryRequirements.*")
    .optional()
    .isString()
    .trim()
    .withMessage("Each dietary requirement must be a string"),

  body("allergies")
    .optional({ nullable: false })
    .isArray()
    .withMessage("Allergies must be an array of strings"),

  body("allergies.*")
    .optional()
    .isString()
    .trim()
    .withMessage("Each allergy must be a string"),

  body("dislikedIngredients")
    .optional({ nullable: false })
    .isArray()
    .withMessage("Disliked ingredients must be an array of strings"),

  body("dislikedIngredients.*")
    .optional()
    .isString()
    .trim()
    .withMessage("Each disliked ingredient must be a string"),

  body("mealType")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 30 })
    .withMessage("Meal type must not exceed 30 characters"),

  body("maxPrepTime")
    .optional({ nullable: true })
    .isInt({ min: 1, max: 1440 })
    .withMessage("Maximum prep time must be an integer between 1 and 1440 minutes"),

  body("servings")
    .optional({ nullable: false })
    .isInt({ min: 1, max: 50 })
    .withMessage("Servings must be an integer between 1 and 50"),

  body("budgetPriority")
    .optional({ nullable: true })
    .trim()
    .isIn(["low", "medium", "high"])
    .withMessage("Budget priority must be low, medium, or high"),

  body("additionalNotes")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Additional notes must not exceed 500 characters"),
];
