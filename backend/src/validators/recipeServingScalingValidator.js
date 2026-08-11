import { body, param } from "express-validator";

export const recipeServingScalingValidation = [
  param("recipeId")
    .isUUID()
    .withMessage("Recipe ID must be a valid UUID"),

  body("servings")
    .isInt({ min: 1 })
    .withMessage("Servings must be at least 1"),
];
