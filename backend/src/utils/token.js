import jwt from "jsonwebtoken";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  if (process.env.NODE_ENV === "production") {
    if (secret.includes("your-super-secret-jwt-key-here") || secret.length < 32) {
      throw new Error(
        "CRITICAL SECURITY CONFIGURATION ERROR: JWT_SECRET must be at least 32 characters and cannot use default placeholders in production."
      );
    }
  }

  return secret;
};

export const generateAccessToken = (userId, tokenVersion = 0) => {
  return jwt.sign(
    {
      sub: userId,
      tokenVersion,
    },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};