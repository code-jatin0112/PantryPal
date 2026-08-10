import { param, query } from "express-validator";

export const pantryExpiryParamsValidation = [
  param("pantryId")
    .isUUID()
    .withMessage("Pantry ID must be a valid UUID"),
];

export const expiringPantryItemsQueryValidation = [
  ...pantryExpiryParamsValidation,

  query("days")
    .optional()
    .isInt({ min: 0, max: 365 })
    .withMessage("Days must be an integer between 0 and 365"),
];
