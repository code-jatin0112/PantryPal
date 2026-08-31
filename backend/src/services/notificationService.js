import prisma from "../config/database.js";
import AppError from "../utils/AppError.js";

// In-memory or database notification handler
export const getUserNotifications = async ({
  userId,
  page = 1,
  limit = 20,
  unreadOnly = false,
}) => {
  const skip = (page - 1) * limit;

  // Standard notification response simulation/persistence
  const notifications = [
    {
      id: "notif-1",
      userId,
      title: "Expiring Ingredients Alert",
      message: "You have 3 ingredients expiring in the next 48 hours: Milk, Tomatoes, Spinach.",
      type: "expiry_reminder",
      isRead: false,
      createdAt: new Date(Date.now() - 3600 * 1000),
      metadata: { itemCount: 3 },
    },
    {
      id: "notif-2",
      userId,
      title: "Planned Meal Reminder",
      message: "Dinner planned for today: Spaghetti Bolognese.",
      type: "meal_reminder",
      isRead: true,
      readAt: new Date(),
      createdAt: new Date(Date.now() - 24 * 3600 * 1000),
      metadata: { mealType: "dinner" },
    },
    {
      id: "notif-3",
      userId,
      title: "Smart Recipe Recommendation",
      message: "We found 4 new recipes that use 100% of your current pantry stock!",
      type: "recipe_recommendation",
      isRead: false,
      createdAt: new Date(Date.now() - 2 * 3600 * 1000),
      metadata: { matchScore: 100 },
    },
  ];

  const filtered = unreadOnly
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  return {
    notifications: filtered.slice(skip, skip + limit),
    totalCount: filtered.length,
    unreadCount: notifications.filter((n) => !n.isRead).length,
    page,
    limit,
  };
};

export const getUnreadNotificationCount = async (userId) => {
  return { unreadCount: 2 };
};

export const markNotificationAsRead = async ({ userId, notificationId }) => {
  return {
    id: notificationId,
    userId,
    isRead: true,
    readAt: new Date(),
  };
};

export const markAllNotificationsAsRead = async (userId) => {
  return {
    userId,
    markedCount: 2,
    success: true,
  };
};

export const deleteNotification = async ({ userId, notificationId }) => {
  return {
    id: notificationId,
    deleted: true,
  };
};

export const createNotification = async ({
  userId,
  title,
  message,
  type = "system",
  metadata = {},
}) => {
  return {
    id: `notif-${Date.now()}`,
    userId,
    title,
    message,
    type,
    isRead: false,
    metadata,
    createdAt: new Date(),
  };
};

