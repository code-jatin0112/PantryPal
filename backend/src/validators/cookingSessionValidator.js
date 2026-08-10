import { body, param } from "express-validator";

export const startCookingSessionValidation = [
  param("recipeId")
    .isUUID()
    .withMessage("Recipe ID must be a valid UUID"),

  body("servings")
    .isInt({ min: 1 })
    .withMessage("Servings must be at least 1"),
];

export const cookingSessionIdValidation = [
  param("sessionId")
    .isUUID()
    .withMessage("Cooking session ID must be a valid UUID"),
];

export const updateCookingProgressValidation = [
  param("sessionId")
    .isUUID()
    .withMessage("Cooking session ID must be a valid UUID"),

  body("currentStep")
    .isInt({ min: 1 })
    .withMessage("Current step must be at least 1"),
];