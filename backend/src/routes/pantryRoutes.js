import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";

import {
  create,
  getAll,
  getOne,
  update,
  remove,
} from "../controllers/pantryController.js";

import {
  createPantryValidation,
  updatePantryValidation,
  pantryIdValidation,
} from "../validators/pantryValidator.js";

import { handleValidationErrors } from "../validators/authValidator.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  createPantryValidation,
  handleValidationErrors,
  create
);

router.get(
  "/",
  getAll
);

router.get(
  "/:pantryId",
  pantryIdValidation,
  handleValidationErrors,
  getOne
);

router.patch(
  "/:pantryId",
  updatePantryValidation,
  handleValidationErrors,
  update
);

router.delete(
  "/:pantryId",
  pantryIdValidation,
  handleValidationErrors,
  remove
);

export default router;