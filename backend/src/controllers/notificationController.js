import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../services/notificationService.js";

export const getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const unreadOnly = req.query.unreadOnly === "true";

    const result = await getUserNotifications({
      userId: req.user.id,
      page,
      limit,
      unreadOnly,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const result = await getUnreadNotificationCount(req.user.id);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const result = await markNotificationAsRead({
      userId: req.user.id,
      notificationId: req.params.id,
    });

    return res.status(200).json({
      success: true,
      data: { notification: result },
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await markAllNotificationsAsRead(req.user.id);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const removeNotification = async (req, res, next) => {
  try {
    await deleteNotification({
      userId: req.user.id,
      notificationId: req.params.id,
    });

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

