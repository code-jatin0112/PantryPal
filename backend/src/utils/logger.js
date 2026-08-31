/**
 * Structured Application Logger
 */

const formatTimestamp = () => new Date().toISOString();

export const logger = {
  info: (message, meta = {}) => {
    console.log(
      JSON.stringify({
        level: "INFO",
        timestamp: formatTimestamp(),
        message,
        ...meta,
      })
    );
  },

  warn: (message, meta = {}) => {
    console.warn(
      JSON.stringify({
        level: "WARN",
        timestamp: formatTimestamp(),
        message,
        ...meta,
      })
    );
  },

  error: (message, error = null, meta = {}) => {
    console.error(
      JSON.stringify({
        level: "ERROR",
        timestamp: formatTimestamp(),
        message,
        error: error
          ? {
              message: error.message,
              stack: error.stack,
              code: error.code || error.statusCode,
            }
          : undefined,
        ...meta,
      })
    );
  },

  http: (req, res, responseTimeMs) => {
    console.log(
      JSON.stringify({
        level: "HTTP",
        timestamp: formatTimestamp(),
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        responseTimeMs,
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers["user-agent"],
      })
    );
  },
};

export default logger;
