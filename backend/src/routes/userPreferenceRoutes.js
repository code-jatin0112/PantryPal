import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { handleValidationErrors } from "../validators/authValidator.js";
import { updatePreferencesValidation } from "../validators/userPreferenceValidator.js";
import {
  getPreferences,
  updatePreferences,
} from "../controllers/userPreferenceController.js";

const router = Router();

router.use(authenticate);

router.get("/", getPreferences);

router.put(
  "/",
  updatePreferencesValidation,
  handleValidationErrors,
  updatePreferences
);

export default router;

