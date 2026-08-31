import { getDashboardMetrics } from "../services/dashboardService.js";

export const getDashboardStats = async (req, res, next) => {
  try {
    const metrics = await getDashboardMetrics(req.user.id);
    return res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
};
