import { param, query } from "express-validator";

export const recipePantryAvailabilityValidation = [
  param("recipeId")
    .isUUID()
    .withMessage("Recipe ID must be a valid UUID"),

  param("pantryId")
    .isUUID()
    .withMessage("Pantry ID must be a valid UUID"),

  query("servings")
    .optional({ nullable: false })
    .isInt({ min: 1, max: 100 })
    .withMessage("Servings must be an integer between 1 and 100"),
];