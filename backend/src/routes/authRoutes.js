import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { getSensitiveActionLimiter } from "../config/security.js";

import {
  register,
  login,
  getCurrentUser,
  updateProfile,
  changePassword,
  deleteAccount,
  exportData,
} from "../controllers/authController.js";

import {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  deleteAccountValidation,
  handleValidationErrors,
} from "../validators/authValidator.js";

const router = express.Router();
const sensitiveLimiter = getSensitiveActionLimiter();

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

// Profile Read
router.get(
  "/me",
  authenticate,
  getCurrentUser
);

router.get(
  "/profile",
  authenticate,
  getCurrentUser
);

// Profile Update (PUT & PATCH)
router.put(
  "/profile",
  authenticate,
  updateProfileValidation,
  handleValidationErrors,
  updateProfile
);

router.patch(
  "/profile",
  authenticate,
  updateProfileValidation,
  handleValidationErrors,
  updateProfile
);

router.put(
  "/me",
  authenticate,
  updateProfileValidation,
  handleValidationErrors,
  updateProfile
);

router.patch(
  "/me",
  authenticate,
  updateProfileValidation,
  handleValidationErrors,
  updateProfile
);

// Password Change
router.post(
  "/change-password",
  authenticate,
  sensitiveLimiter,
  changePasswordValidation,
  handleValidationErrors,
  changePassword
);

// Account Deletion
router.delete(
  "/account",
  authenticate,
  sensitiveLimiter,
  deleteAccountValidation,
  handleValidationErrors,
  deleteAccount
);

router.delete(
  "/me",
  authenticate,
  sensitiveLimiter,
  deleteAccountValidation,
  handleValidationErrors,
  deleteAccount
);

// Data Export
router.get(
  "/export",
  authenticate,
  exportData
);

export default router;
