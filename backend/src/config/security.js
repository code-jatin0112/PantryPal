import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import AppError from "../utils/AppError.js";

export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
});

export const getCorsOptions = () => {
  const allowedOriginsEnv =
    process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN || "";

  const parsedOrigins = allowedOriginsEnv
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const defaultOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
  ];

  const allowedOrigins =
    parsedOrigins.length > 0 ? parsedOrigins : defaultOrigins;

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      if (
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(
        new AppError(
          "Origin not allowed by CORS policy",
          403,
          "CORS_ORIGIN_NOT_ALLOWED"
        )
      );
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: [
      "RateLimit-Limit",
      "RateLimit-Remaining",
      "RateLimit-Reset",
      "Retry-After",
    ],
    maxAge: 86400,
  });
};

export const getRateLimiter = (options = {}) => {
  const windowMs = Number(
    process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000
  );
  const max = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 500);

  return rateLimit({
    windowMs: options.windowMs ?? windowMs,
    max: options.max ?? max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
      return res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests, please try again later",
        },
      });
    },
    ...options,
  });
};

