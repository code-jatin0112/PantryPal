import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  removeNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);
router.delete("/:id", removeNotification);

export default router;

