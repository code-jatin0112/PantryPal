import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { getDashboardStats } from "../controllers/dashboardController.js";

const router = express.Router();

router.use(authenticate);
router.get("/stats", getDashboardStats);
router.get("/", getDashboardStats);

export default router;

