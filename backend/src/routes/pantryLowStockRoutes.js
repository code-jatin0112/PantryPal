import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";

import {
  getLowStock,
} from "../controllers/pantryLowStockController.js";

import {
  lowStockPantryItemsQueryValidation,
} from "../validators/pantryLowStockValidator.js";

import { handleValidationErrors } from "../validators/authValidator.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/:pantryId/low-stock",
  lowStockPantryItemsQueryValidation,
  handleValidationErrors,
  getLowStock
);

export default router;