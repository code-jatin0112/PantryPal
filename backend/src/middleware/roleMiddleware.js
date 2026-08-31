import AppError from "../utils/AppError.js";

/**
 * Middleware to restrict route access to specific user roles
 * @param  {...string} allowedRoles - Allowed roles (e.g. 'admin', 'moderator')
 */
export const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      // If role not loaded, allow 'user' default if included
      if (allowedRoles.includes("user")) {
        return next();
      }
      return next(
        new AppError(
          "You do not have permission to perform this action",
          403,
          "FORBIDDEN"
        )
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          "You do not have permission to perform this action",
          403,
          "FORBIDDEN"
        )
      );
    }

    next();
  };
};

export default restrictTo;

