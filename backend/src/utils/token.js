import jwt from "jsonwebtoken";

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return process.env.JWT_SECRET;
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