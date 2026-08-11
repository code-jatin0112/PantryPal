import { body } from "express-validator";

export const generateAIRecipeValidation = [
  body("pantryId")
    .isUUID()
    .withMessage("Pantry ID must be a valid UUID"),

  body("servings")
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage("Servings must be an integer between 1 and 20"),

  body("preferences")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Preferences must not exceed 500 characters"),
];