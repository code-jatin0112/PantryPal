import { body, param } from "express-validator";

export const recipeIngredientParamsValidation = [
  param("recipeId")
    .isUUID()
    .withMessage("Recipe ID must be a valid UUID"),

  param("ingredientId")
    .isUUID()
    .withMessage("Ingredient ID must be a valid UUID"),
];

export const recipeIdValidation = [
  param("recipeId")
    .isUUID()
    .withMessage("Recipe ID must be a valid UUID"),
];

export const createRecipeIngredientValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Ingredient name is required")
    .isLength({ max: 100 })
    .withMessage("Ingredient name must not exceed 100 characters"),

  body("quantity")
    .isFloat({ gt: 0 })
    .withMessage("Quantity must be greater than 0"),

  body("unit")
    .trim()
    .notEmpty()
    .withMessage("Unit is required")
    .isLength({ max: 30 })
    .withMessage("Unit must not exceed 30 characters"),
];

export const updateRecipeIngredientValidation = [
  param("recipeId")
    .isUUID()
    .withMessage("Recipe ID must be a valid UUID"),

  param("ingredientId")
    .isUUID()
    .withMessage("Ingredient ID must be a valid UUID"),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Ingredient name cannot be empty")
    .isLength({ max: 100 })
    .withMessage("Ingredient name must not exceed 100 characters"),

  body("quantity")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Quantity must be greater than 0"),

  body("unit")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Unit cannot be empty")
    .isLength({ max: 30 })
    .withMessage("Unit must not exceed 30 characters"),
];