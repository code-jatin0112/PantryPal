import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";

import {
  create,
  getAll,
  getOne,
  update,
  remove,
} from "../controllers/pantryItemController.js";

import {
  pantryIdValidation,
  pantryItemIdValidation,
  createPantryItemValidation,
  updatePantryItemValidation,
  adjustPantryItemValidation,
} from "../validators/pantryItemValidator.js";

import { handleValidationErrors } from "../validators/authValidator.js";

import {
  adjustStock,
} from "../controllers/pantryStockAdjustmentController.js";

const router = express.Router({ mergeParams: true });

router.use(authenticate);

router.post(
  "/",
  createPantryItemValidation,
  handleValidationErrors,
  create
);

router.get(
  "/",
  pantryIdValidation,
  handleValidationErrors,
  getAll
);

router.post(
  "/:itemId/adjust",
  adjustPantryItemValidation,
  handleValidationErrors,
  adjustStock
);

router.get(
  "/:itemId",
  pantryItemIdValidation,
  handleValidationErrors,
  getOne
);

router.patch(
  "/:itemId",
  updatePantryItemValidation,
  handleValidationErrors,
  update
);

router.delete(
  "/:itemId",
  pantryItemIdValidation,
  handleValidationErrors,
  remove
);

export default router;