import { body, param } from "express-validator";

export const createPantryValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Pantry name must be between 1 and 100 characters"),
];

export const updatePantryValidation = [
  param("pantryId")
    .isUUID()
    .withMessage("Pantry ID must be a valid UUID"),

  body("name")
    .trim()
    .notEmpty()
    .withMessage("Pantry name is required")
    .isLength({ max: 100 })
    .withMessage("Pantry name must not exceed 100 characters"),
];

export const pantryIdValidation = [
  param("pantryId")
    .isUUID()
    .withMessage("Pantry ID must be a valid UUID"),
];