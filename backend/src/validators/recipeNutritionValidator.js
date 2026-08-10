import { body, param } from "express-validator";

export const recipeNutritionValidation = [
  param("recipeId")
    .isUUID()
    .withMessage("Recipe ID must be a valid UUID"),
];

export const createRecipeNutritionValidation = [
  ...recipeNutritionValidation,

  body("calories")
    .isFloat({ min: 0 })
    .withMessage("Calories must be 0 or greater"),

  body("protein")
    .isFloat({ min: 0 })
    .withMessage("Protein must be 0 or greater"),

  body("carbohydrates")
    .isFloat({ min: 0 })
    .withMessage("Carbohydrates must be 0 or greater"),

  body("fat")
    .isFloat({ min: 0 })
    .withMessage("Fat must be 0 or greater"),

  body("fiber")
    .isFloat({ min: 0 })
    .withMessage("Fiber must be 0 or greater"),

  body("sugar")
    .isFloat({ min: 0 })
    .withMessage("Sugar must be 0 or greater"),
];

export const updateRecipeNutritionValidation = [
  ...recipeNutritionValidation,

  body("calories")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Calories must be 0 or greater"),

  body("protein")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Protein must be 0 or greater"),

  body("carbohydrates")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Carbohydrates must be 0 or greater"),

  body("fat")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Fat must be 0 or greater"),

  body("fiber")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Fiber must be 0 or greater"),

  body("sugar")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Sugar must be 0 or greater"),
];
