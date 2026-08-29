import { body } from "express-validator";

export const chatWithKitchenAssistantValidation = [
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isString()
    .withMessage("Message must be a string")
    .isLength({ min: 1, max: 2000 })
    .withMessage("Message must be between 1 and 2000 characters"),

  body("conversationHistory")
    .optional({ nullable: false })
    .isArray({ max: 20 })
    .withMessage("conversationHistory must be an array of at most 20 messages"),

  body("conversationHistory.*.role")
    .optional()
    .trim()
    .isIn(["user", "assistant", "system"])
    .withMessage("Role must be 'user', 'assistant', or 'system'"),

  body("conversationHistory.*.content")
    .optional()
    .isString()
    .withMessage("Content must be a string")
    .isLength({ max: 2000 })
    .withMessage("Content must not exceed 2000 characters"),
];

