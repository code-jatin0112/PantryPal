import { body } from "express-validator";

export const updatePreferencesValidation = [
  body("dietaryPreferences")
    .optional({ nullable: false })
    .isArray()
    .withMessage("dietaryPreferences must be an array of strings"),

  body("dietaryPreferences.*")
    .optional()
    .isString()
    .trim()
    .withMessage("Each dietary preference must be a string"),

  body("allergies")
    .optional({ nullable: false })
    .isArray()
    .withMessage("allergies must be an array of strings"),

  body("allergies.*")
    .optional()
    .isString()
    .trim()
    .withMessage("Each allergy must be a string"),

  body("dislikedIngredients")
    .optional({ nullable: false })
    .isArray()
    .withMessage("dislikedIngredients must be an array of strings"),

  body("dislikedIngredients.*")
    .optional()
    .isString()
    .trim()
    .withMessage("Each disliked ingredient must be a string"),

  body("defaultServings")
    .optional({ nullable: false })
    .isInt({ min: 1, max: 50 })
    .withMessage("defaultServings must be an integer between 1 and 50"),

  body("maxCookingMinutes")
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null) return true;
      const intVal = Number(value);
      if (!Number.isInteger(intVal) || intVal < 1 || intVal > 1440) {
        throw new Error("maxCookingMinutes must be an integer between 1 and 1440, or null");
      }
      return true;
    }),

  body("defaultBudget")
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null) return true;
      const numVal = Number(value);
      if (isNaN(numVal) || numVal < 0) {
        throw new Error("defaultBudget must be a non-negative number, or null");
      }
      return true;
    }),
];
