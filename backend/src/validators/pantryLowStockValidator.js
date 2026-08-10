import { param, query } from "express-validator";

export const lowStockPantryItemsQueryValidation = [
  param("pantryId")
    .isUUID()
    .withMessage("Pantry ID must be a valid UUID"),

  query("threshold")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Threshold must be greater than 0"),
];