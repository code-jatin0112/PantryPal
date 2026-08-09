import { body, param } from "express-validator";

export const pantryIdValidation = [
  param("pantryId")
    .isUUID()
    .withMessage("Pantry ID must be a valid UUID"),
];

export const pantryItemIdValidation = [
  param("pantryId")
    .isUUID()
    .withMessage("Pantry ID must be a valid UUID"),

  param("itemId")
    .isUUID()
    .withMessage("Item ID must be a valid UUID"),
];

export const createPantryItemValidation = [
  param("pantryId")
    .isUUID()
    .withMessage("Pantry ID must be a valid UUID"),

  body("name")
    .trim()
    .notEmpty()
    .withMessage("Item name is required")
    .isLength({ max: 100 })
    .withMessage("Item name must not exceed 100 characters"),

  body("quantity")
    .isFloat({ gt: 0 })
    .withMessage("Quantity must be greater than 0"),

  body("unit")
    .trim()
    .notEmpty()
    .withMessage("Unit is required")
    .isLength({ max: 30 })
    .withMessage("Unit must not exceed 30 characters"),

  body("expiryDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Expiry date must be a valid date"),
];

export const updatePantryItemValidation = [
  param("pantryId")
    .isUUID()
    .withMessage("Pantry ID must be a valid UUID"),

  param("itemId")
    .isUUID()
    .withMessage("Item ID must be a valid UUID"),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Item name cannot be empty")
    .isLength({ max: 100 })
    .withMessage("Item name must not exceed 100 characters"),

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

  body("expiryDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Expiry date must be a valid date"),
];