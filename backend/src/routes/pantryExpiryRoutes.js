import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";

import {
  getExpiring,
  getExpired,
} from "../controllers/pantryExpiryController.js";

import {
  expiringPantryItemsQueryValidation,
  pantryExpiryParamsValidation,
} from "../validators/pantryExpiryValidator.js";

import { handleValidationErrors } from "../validators/authValidator.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/:pantryId/expiring",
  expiringPantryItemsQueryValidation,
  handleValidationErrors,
  getExpiring
);

router.get(
  "/:pantryId/expired",
  pantryExpiryParamsValidation,
  handleValidationErrors,
  getExpired
);

export default router;