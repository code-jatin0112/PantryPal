import { body, param } from "express-validator";

export const consumeRecipeValidation = [
  param("recipeId")
    .isUUID()
    .withMessage("Recipe ID must be a valid UUID"),

  body("pantryId")
    .isUUID()
    .withMessage("Pantry ID must be a valid UUID"),

  body("servings")
    .optional({ nullable: false })
    .isInt({ min: 1, max: 100 })
    .withMessage("Servings must be an integer between 1 and 100"),
];