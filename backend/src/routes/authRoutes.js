import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { getSensitiveActionLimiter, getAuthLimiter } from "../config/security.js";

import {
  register,
  login,
  getCurrentUser,
  updateProfile,
  changePassword,
  deleteAccount,
  retryDeletion,
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
const authLimiter = getAuthLimiter();

router.post(
  "/register",
  authLimiter,
  registerValidation,
  handleValidationErrors,
  register
);

router.post(
  "/login",
  authLimiter,
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

router.post(
  "/account/retry-deletion",
  sensitiveLimiter,
  retryDeletion
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
