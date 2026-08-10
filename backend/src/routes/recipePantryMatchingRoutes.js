import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";

import {
  getRecipePantryAvailabilityController,
} from "../controllers/recipePantryMatchingController.js";

import {
  recipePantryAvailabilityValidation,
} from "../validators/recipePantryMatchingValidator.js";

import { handleValidationErrors } from "../validators/authValidator.js";

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.get(
  "/availability",
  recipePantryAvailabilityValidation,
  handleValidationErrors,
  getRecipePantryAvailabilityController
);

export default router;