import prisma from "../config/database.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateAccessToken } from "../utils/token.js";
import AppError from "../utils/AppError.js";

export const registerUser = async ({ name, email, password }) => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError(
      "User with this email already exists",
      409,
      "EMAIL_ALREADY_EXISTS"
    );
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  const accessToken = generateAccessToken(user.id, user.tokenVersion ?? 0);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    accessToken,
  };
};

export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.isActive) {
    throw new AppError(
      "Invalid email or password",
      401,
      "INVALID_CREDENTIALS"
    );
  }

  const passwordMatches = await comparePassword(password, user.password);

  if (!passwordMatches) {
    throw new AppError(
      "Invalid email or password",
      401,
      "INVALID_CREDENTIALS"
    );
  }

  const accessToken = generateAccessToken(user.id, user.tokenVersion ?? 0);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    accessToken,
  };
};

export const getCurrentUser = async ({ userId }) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user || !user.isActive) {
    throw new AppError(
      "User account is not available",
      401,
      "USER_NOT_AVAILABLE"
    );
  }

  return {
    user,
  };
};

export const updateUserProfile = async ({ userId, name, email }) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser || !existingUser.isActive) {
    throw new AppError(
      "User account is not available",
      401,
      "USER_NOT_AVAILABLE"
    );
  }

  const updateData = {};
  if (name !== undefined) {
    updateData.name = name ? name.trim() : null;
  }

  if (email !== undefined) {
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail !== existingUser.email.toLowerCase()) {
      const emailInUse = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (emailInUse && emailInUse.id !== userId) {
        throw new AppError(
          "User with this email already exists",
          409,
          "EMAIL_ALREADY_EXISTS"
        );
      }
      updateData.email = normalizedEmail;
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    user: updatedUser,
  };
};

export const changeUserPassword = async ({
  userId,
  currentPassword,
  newPassword,
}) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.isActive || user.deletionStatus === "PENDING_DELETION") {
    throw new AppError(
      "User account is not available",
      401,
      "USER_NOT_AVAILABLE"
    );
  }

  const passwordMatches = await comparePassword(currentPassword, user.password);
  if (!passwordMatches) {
    throw new AppError(
      "Current password is incorrect",
      400,
      "INVALID_CURRENT_PASSWORD"
    );
  }

  if (currentPassword === newPassword) {
    throw new AppError(
      "New password must be different from current password",
      400,
      "PASSWORD_UNCHANGED"
    );
  }

  const hashedPassword = await hashPassword(newPassword);

  // Increment tokenVersion to invalidate existing tokens across all sessions/devices
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      tokenVersion: { increment: 1 },
    },
    select: {
      id: true,
      tokenVersion: true,
    },
  });

  // Issue a fresh access token with the incremented tokenVersion for the current session
  const accessToken = generateAccessToken(
    updatedUser.id,
    updatedUser.tokenVersion
  );

  return {
    message: "Password changed successfully",
    accessToken,
  };
};

export const deleteUserAccount = async ({ userId, password }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || (!user.isActive && user.deletionStatus !== "PENDING_DELETION")) {
    throw new AppError(
      "User account is not available",
      401,
      "USER_NOT_AVAILABLE"
    );
  }

  // Verify password if not already locked in PENDING_DELETION
  if (user.deletionStatus !== "PENDING_DELETION") {
    const passwordMatches = await comparePassword(password, user.password);
    if (!passwordMatches) {
      throw new AppError(
        "Incorrect password. Verification failed.",
        400,
        "INVALID_PASSWORD"
      );
    }
  }

  // 1. Immediately transition to durable PENDING_DELETION state
  // This locks out the account and revokes active sessions across all routes
  await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: false,
      deletionStatus: "PENDING_DELETION",
      tokenVersion: { increment: 1 },
    },
  });

  // 2. Clean up NoSQL telemetry (MongoDB AI interaction logs)
  if (process.env.MONGO_URI) {
    try {
      const { default: mongoose } = await import("mongoose");
      const { connectMongo } = await import("../config/mongo.js");
      if (mongoose.connection.readyState === 0) {
        await connectMongo();
      }
      if (mongoose.connection.readyState === 1) {
        const { AiInteractionLog } = await import("../models/AiInteractionLog.js");
        if (AiInteractionLog) {
          await AiInteractionLog.deleteMany({ userId });
        }
      } else {
        throw new Error("MongoDB connection unavailable");
      }
    } catch (mongoErr) {
      console.error(
        "Failed to delete MongoDB AI logs during account deletion:",
        mongoErr.message
      );
      throw new AppError(
        "Account entered pending deletion, but NoSQL telemetry cleanup failed. Please retry to complete deletion.",
        502,
        "TELEMETRY_CLEANUP_FAILED"
      );
    }
  }

  // 3. PostgreSQL transactional cascade deletion
  await prisma.$transaction(async (tx) => {
    await tx.user.delete({
      where: { id: userId },
    });
  });

  return {
    message: "Account and associated data deleted successfully",
  };
};

export const exportUserData = async ({ userId }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user || !user.isActive) {
    throw new AppError(
      "User account is not available",
      401,
      "USER_NOT_AVAILABLE"
    );
  }

  const [
    preferences,
    pantries,
    recipes,
    shoppingItems,
    mealPlans,
    favorites,
    cookingSessions,
  ] = await Promise.all([
    prisma.userPreference.findUnique({ where: { userId } }),
    prisma.pantry.findMany({
      where: { userId },
      include: {
        items: true,
      },
    }),
    prisma.recipe.findMany({
      where: { userId },
      include: {
        ingredients: true,
        nutrition: true,
      },
    }),
    prisma.shoppingListItem.findMany({
      where: { userId },
    }),
    prisma.mealPlan.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            recipe: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    }),
    prisma.recipeFavorite.findMany({
      where: { userId },
      include: {
        recipe: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
    prisma.cookingSession.findMany({
      where: { userId },
      include: {
        recipe: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    version: "1.0.0",
    account: user,
    preferences: preferences
      ? {
          ...preferences,
          dietaryRequirements: preferences.dietaryPreferences,
        }
      : null,
    pantries,
    recipes,
    shoppingList: shoppingItems,
    mealPlans,
    favorites,
    cookingSessions,
  };
};
