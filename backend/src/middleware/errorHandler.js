import { sanitizeDatabaseUrl } from "../utils/testDatabaseGuard.js";

export const errorHandler = (err, req, res, next) => {
  if (err) {
    const rawMsg = err.stack || err.message || String(err);
    console.error(sanitizeDatabaseUrl(rawMsg));
  }

  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || "INTERNAL_SERVER_ERROR",
      message:
        statusCode === 500
          ? "An unexpected error occurred"
          : err.message,
    },
  });
};