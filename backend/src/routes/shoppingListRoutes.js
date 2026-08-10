import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";

import {
  createShoppingListItemController,
  getShoppingListItemsController,
  getShoppingListItemByIdController,
  updateShoppingListItemController,
  deleteShoppingListItemController,
  clearPurchasedShoppingListItemsController,
} from "../controllers/shoppingListController.js";

import {
  shoppingListItemParamsValidation,
  createShoppingListItemValidation,
  updateShoppingListItemValidation,
  shoppingListQueryValidation,
} from "../validators/shoppingListValidator.js";

import { handleValidationErrors } from "../validators/authValidator.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  createShoppingListItemValidation,
  handleValidationErrors,
  createShoppingListItemController
);

router.get(
  "/",
  shoppingListQueryValidation,
  handleValidationErrors,
  getShoppingListItemsController
);

router.get(
  "/:itemId",
  shoppingListItemParamsValidation,
  handleValidationErrors,
  getShoppingListItemByIdController
);

router.patch(
  "/:itemId",
  updateShoppingListItemValidation,
  handleValidationErrors,
  updateShoppingListItemController
);

router.delete(
  "/purchased",
  clearPurchasedShoppingListItemsController
);

router.delete(
  "/:itemId",
  shoppingListItemParamsValidation,
  handleValidationErrors,
  deleteShoppingListItemController
);

export default router;