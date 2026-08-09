import { body, param } from "express-validator";

export const recipeIdValidation = [
  param("recipeId")
    .isUUID()
    .withMessage("Recipe ID must be a valid UUID"),
];

export const createRecipeValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Recipe title is required")
    .isLength({ max: 100 })
    .withMessage("Recipe title must not exceed 100 characters"),

  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),

  body("instructions")
    .trim()
    .notEmpty()
    .withMessage("Recipe instructions are required"),

  body("prepTime")
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage("Preparation time must be a non-negative integer"),

  body("cookTime")
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage("Cooking time must be a non-negative integer"),

  body("servings")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("Servings must be at least 1"),
];

export const updateRecipeValidation = [
  param("recipeId")
    .isUUID()
    .withMessage("Recipe ID must be a valid UUID"),

  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Recipe title cannot be empty")
    .isLength({ max: 100 })
    .withMessage("Recipe title must not exceed 100 characters"),

  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),

  body("instructions")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Recipe instructions cannot be empty"),

  body("prepTime")
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage("Preparation time must be a non-negative integer"),

  body("cookTime")
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage("Cooking time must be a non-negative integer"),

  body("servings")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("Servings must be at least 1"),
];