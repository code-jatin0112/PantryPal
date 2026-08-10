import { param } from "express-validator";

export const recipePantryAvailabilityValidation = [
  param("recipeId")
    .isUUID()
    .withMessage("Recipe ID must be a valid UUID"),

  param("pantryId")
    .isUUID()
    .withMessage("Pantry ID must be a valid UUID"),
];