import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";

import {
  register,
  login,
  getCurrentUser,
} from "../controllers/authController.js";

import {
  registerValidation,
  loginValidation,
  handleValidationErrors,
} from "../validators/authValidator.js";

const router = express.Router();

router.post(
  "/register",
  registerValidation,
  handleValidationErrors,
  register
);

router.post(
  "/login",
  loginValidation,
  handleValidationErrors,
  login
);

router.get(
  "/me",
  authenticate,
  getCurrentUser
);

export default router;