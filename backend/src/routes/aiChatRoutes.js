import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  chatWithKitchenAssistantController,
} from "../controllers/aiChatController.js";
import {
  chatWithKitchenAssistantValidation,
} from "../validators/aiChatValidator.js";
import { handleValidationErrors } from "../validators/authValidator.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/chat",
  chatWithKitchenAssistantValidation,
  handleValidationErrors,
  chatWithKitchenAssistantController
);

export default router;

