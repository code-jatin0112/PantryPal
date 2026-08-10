import { param } from "express-validator";

export const recipeFavoriteParamsValidation = [
  param("recipeId")
    .isUUID()
    .withMessage("Recipe ID must be a valid UUID"),
];