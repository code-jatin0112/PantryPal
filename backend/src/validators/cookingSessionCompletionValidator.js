import { body, param } from "express-validator";

export const completeCookingSessionValidation = [
  param("sessionId")
    .isUUID()
    .withMessage("Cooking session ID must be a valid UUID"),

  body("pantryId")
    .isUUID()
    .withMessage("Pantry ID must be a valid UUID"),
];