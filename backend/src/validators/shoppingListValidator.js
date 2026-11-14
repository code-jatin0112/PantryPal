import { body, param, query } from "express-validator";

export const shoppingListItemParamsValidation = [
  param("itemId")
    .isUUID()
    .withMessage("Shopping list item ID must be a valid UUID"),
];

export const createShoppingListItemValidation = [
  body("recipeId")
    .optional()
    .isUUID()
    .withMessage("Recipe ID must be a valid UUID"),

  body("name")
    .trim()
    .notEmpty()
    .withMessage("Shopping item name is required")
    .isLength({ max: 100 })
    .withMessage("Shopping item name must not exceed 100 characters"),

  body("quantity")
    .isFloat({ gt: 0 })
    .withMessage("Quantity must be greater than 0"),

  body("unit")
    .trim()
    .notEmpty()
    .withMessage("Unit is required")
    .isLength({ max: 30 })
    .withMessage("Unit must not exceed 30 characters"),

  body("category")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage("Category must not exceed 50 characters"),

  body("priority")
    .optional({ nullable: true })
    .trim()
    .toUpperCase()
    .isIn(["HIGH", "MEDIUM", "LOW"])
    .withMessage("Priority must be HIGH, MEDIUM, or LOW"),
];

export const updateShoppingListItemValidation = [
  ...shoppingListItemParamsValidation,

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Shopping item name cannot be empty")
    .isLength({ max: 100 })
    .withMessage("Shopping item name must not exceed 100 characters"),

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

  body("isPurchased")
    .optional()
    .isBoolean()
    .withMessage("isPurchased must be a boolean"),

  body("category")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage("Category must not exceed 50 characters"),

  body("priority")
    .optional({ nullable: true })
    .trim()
    .toUpperCase()
    .isIn(["HIGH", "MEDIUM", "LOW"])
    .withMessage("Priority must be HIGH, MEDIUM, or LOW"),
];

export const shoppingListQueryValidation = [
  query("isPurchased")
    .optional()
    .isBoolean()
    .withMessage("isPurchased must be a boolean"),

  query("category")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Category must not exceed 50 characters"),

  query("priority")
    .optional()
    .trim()
    .toUpperCase()
    .isIn(["ALL", "HIGH", "MEDIUM", "LOW"])
    .withMessage("Priority must be ALL, HIGH, MEDIUM, or LOW"),
];