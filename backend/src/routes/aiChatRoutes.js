import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { getAiLimiter } from "../config/security.js";
import {
  chatWithKitchenAssistantController,
} from "../controllers/aiChatController.js";
import {
  chatWithKitchenAssistantValidation,
} from "../validators/aiChatValidator.js";
import { handleValidationErrors } from "../validators/authValidator.js";

const router = express.Router();
const aiLimiter = getAiLimiter();

router.use(authenticate);

router.post(
  "/chat",
  aiLimiter,
  chatWithKitchenAssistantValidation,
  handleValidationErrors,
  chatWithKitchenAssistantController
);

export default router;

