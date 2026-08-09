import AppError from "../utils/AppError.js";
import { verifyAccessToken } from "../utils/token.js";

export const authenticate = (req, res, next) => {
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

  try {
    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.sub,
    };

    next();
  } catch (error) {
    return next(
      new AppError(
        "Invalid or expired authentication token",
        401,
        "INVALID_TOKEN"
      )
    );
  }
};