import AppError from "../utils/AppError.js";
import { verifyAccessToken } from "../utils/token.js";
import prisma from "../config/database.js";

export const authenticate = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return next(
      new AppError(
        "Authentication token is required",
        401,
        "AUTHENTICATION_REQUIRED"
      )
    );
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(
      new AppError(
        "Authorization header must use Bearer token",
        401,
        "INVALID_AUTH_HEADER"
      )
    );
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    return next(
      new AppError(
        "Invalid or expired authentication token",
        401,
        "INVALID_TOKEN"
      )
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        isActive: true,
        tokenVersion: true,
        deletionStatus: true,
      },
    });

    const isDeleteRetry =
      user &&
      user.deletionStatus === "PENDING_DELETION" &&
      req.method === "DELETE" &&
      (req.path === "/account" ||
        req.path === "/me" ||
        req.baseUrl + req.path === "/api/v1/auth/account");

    if (!user || !user.isActive || user.deletionStatus === "PENDING_DELETION") {
      if (!isDeleteRetry) {
        return next(
          new AppError(
            "User account is not available",
            401,
            "USER_NOT_AVAILABLE"
          )
        );
      }
    }

    // Token revocation check:
    const tokenVersionInJwt = payload.tokenVersion ?? 0;
    const userTokenVersion = user?.tokenVersion ?? 0;

    if (!isDeleteRetry && tokenVersionInJwt !== userTokenVersion) {
      return next(
        new AppError(
          "Session has been revoked due to a password change or security update. Please log in again.",
          401,
          "TOKEN_REVOKED"
        )
      );
    }

    req.user = {
      id: user.id,
      tokenVersion: user.tokenVersion,
    };

    next();
  } catch (error) {
    return next(error);
  }
};
