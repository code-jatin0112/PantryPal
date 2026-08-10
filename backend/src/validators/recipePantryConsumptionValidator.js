import { body, param } from "express-validator";

export const consumeRecipeValidation = [
  param("recipeId")
    .isUUID()
    .withMessage("Recipe ID must be a valid UUID"),

  body("pantryId")
    .isUUID()
    .withMessage("Pantry ID must be a valid UUID"),
];