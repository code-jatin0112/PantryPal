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
} from "../validators/pantryItemValidator.js";

import { handleValidationErrors } from "../validators/authValidator.js";

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