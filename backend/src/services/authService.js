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

  if (!user) {
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

  if (!user.isActive) {
    if (
      user.deletionStatus === "PENDING_DELETION" ||
      user.deletionStatus === "DELETION_FAILED"
    ) {
      throw new AppError(
        "This account is scheduled for deletion, but background data cleanup is still pending. You may retry finalization.",
        403,
        "ACCOUNT_PENDING_DELETION"
      );
    }
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

  if (
    !user ||
    (!user.isActive &&
      user.deletionStatus !== "PENDING_DELETION" &&
      user.deletionStatus !== "DELETION_FAILED")
  ) {
    throw new AppError(
      "User account is not available",
      401,
      "USER_NOT_AVAILABLE"
    );
  }

  // Always verify password to prevent unauthorized deletion
  const passwordMatches = await comparePassword(password, user.password);
  if (!passwordMatches) {
    throw new AppError(
      "Incorrect password. Verification failed.",
      400,
      "INVALID_PASSWORD"
    );
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
  if (process.env.MONGO_URI || process.env.MONGO_TEST_URI) {
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
      await prisma.user.update({
        where: { id: userId },
        data: { deletionStatus: "DELETION_FAILED" },
      }).catch(() => {});
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

/**
 * Robust deletion retry and reconciliation path.
 * Survives page reload, token loss, and process restart by authenticating credentials.
 */
export const retryAccountDeletion = async ({ email, password, userId }) => {
  if (!password) {
    throw new AppError(
      "Password is required to verify identity for deletion recovery.",
      400,
      "INVALID_PASSWORD"
    );
  }

  let user = null;
  if (userId) {
    user = await prisma.user.findUnique({ where: { id: userId } });
  } else if (email) {
    user = await prisma.user.findUnique({ where: { email } });
  }

  // Avoid exposing account-existence information unnecessarily through unauthenticated responses
  if (!user) {
    throw new AppError(
      "Invalid credentials. Verification failed.",
      401,
      "INVALID_CREDENTIALS"
    );
  }

  // Mandatory identity verification
  const passwordMatches = await comparePassword(password, user.password);
  if (!passwordMatches) {
    throw new AppError(
      "Invalid credentials. Verification failed.",
      401,
      "INVALID_CREDENTIALS"
    );
  }

  // The endpoint must ONLY finalize accounts whose deletionStatus is PENDING_DELETION or DELETION_FAILED.
  const allowedDeletionStatuses = ["PENDING_DELETION", "DELETION_FAILED"];
  if (!allowedDeletionStatuses.includes(user.deletionStatus)) {
    // For a normal active account:
    // - Do not change isActive.
    // - Do not change tokenVersion.
    // - Do not delete any data.
    // - Return an appropriate non-success response.
    throw new AppError(
      "Account is not scheduled for deletion recovery. Normal accounts cannot be finalized via recovery.",
      400,
      "ACCOUNT_NOT_PENDING_DELETION"
    );
  }

  // Attempt NoSQL cleanup
  let mongoSuccess = true;
  if (process.env.MONGO_URI || process.env.MONGO_TEST_URI) {
    try {
      const { default: mongoose } = await import("mongoose");
      const { connectMongo } = await import("../config/mongo.js");
      if (mongoose.connection.readyState === 0) {
        await connectMongo();
      }
      if (mongoose.connection.readyState === 1) {
        const { AiInteractionLog } = await import("../models/AiInteractionLog.js");
        if (AiInteractionLog) {
          await AiInteractionLog.deleteMany({ userId: user.id });
        }
      } else {
        mongoSuccess = false;
      }
    } catch (err) {
      console.warn("MongoDB retry cleanup failed:", err.message);
      mongoSuccess = false;
    }
  }

  if (!mongoSuccess) {
    await prisma.user.update({
      where: { id: user.id },
      data: { deletionStatus: "DELETION_FAILED" },
    }).catch(() => {});

    throw new AppError(
      "Telemetry cleanup failed during retry. Account remains locked in deletion state. Please retry or wait for background recovery.",
      502,
      "TELEMETRY_CLEANUP_FAILED"
    );
  }

  // PostgreSQL transactional cascade deletion
  await prisma.$transaction(async (tx) => {
    await tx.user.delete({
      where: { id: user.id },
    });
  });

  return {
    status: "COMPLETED",
    message: "Account and associated data deleted successfully",
  };
};

/**
 * Server-side durable scheduled reconciliation.
 * Automatically recovers pending accounts across process restarts or network outages.
 */
export const reconcilePendingAccountDeletions = async () => {
  const pendingUsers = await prisma.user.findMany({
    where: {
      deletionStatus: { in: ["PENDING_DELETION", "DELETION_FAILED"] },
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (pendingUsers.length === 0) {
    return { reconciled: 0, failed: 0 };
  }

  console.log(`[Reconciliation] Found ${pendingUsers.length} account(s) pending deletion finalization.`);

  let reconciled = 0;
  let failed = 0;

  for (const user of pendingUsers) {
    let mongoSuccess = true;
    if (process.env.MONGO_URI || process.env.MONGO_TEST_URI) {
      try {
        const { default: mongoose } = await import("mongoose");
        const { connectMongo } = await import("../config/mongo.js");
        if (mongoose.connection.readyState === 0) {
          await connectMongo();
        }
        if (mongoose.connection.readyState === 1) {
          const { AiInteractionLog } = await import("../models/AiInteractionLog.js");
          if (AiInteractionLog) {
            await AiInteractionLog.deleteMany({ userId: user.id });
          }
        } else {
          mongoSuccess = false;
        }
      } catch (err) {
        console.warn(`[Reconciliation] MongoDB cleanup failed for user ${user.id}:`, err.message);
        mongoSuccess = false;
      }
    }

    if (mongoSuccess) {
      try {
        await prisma.user.delete({ where: { id: user.id } });
        console.log(`[Reconciliation] Successfully finalized deletion for user ${user.id}`);
        reconciled++;
      } catch (err) {
        console.error(`[Reconciliation] PostgreSQL deletion failed for user ${user.id}:`, err.message);
        failed++;
      }
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { deletionStatus: "DELETION_FAILED" },
      }).catch(() => {});
      failed++;
    }
  }

  return { reconciled, failed };
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

  if (!user || !user.isActive || user.deletionStatus === "PENDING_DELETION") {
    throw new AppError(
      "User account is not available",
      401,
      "USER_NOT_AVAILABLE"
    );
  }

  // Fetch MongoDB AI interaction history scoped strictly to userId
  let aiLogs = [];
  let aiLogsStatus = "not_configured";

  if (process.env.MONGO_URI || process.env.MONGO_TEST_URI) {
    try {
      const { default: mongoose } = await import("mongoose");
      const { connectMongo } = await import("../config/mongo.js");
      if (mongoose.connection.readyState === 0) {
        await connectMongo();
      }
      if (mongoose.connection.readyState === 1) {
        const { AiInteractionLog } = await import("../models/AiInteractionLog.js");
        if (AiInteractionLog) {
          aiLogs = await AiInteractionLog.find({ userId })
            .select("-_id -__v")
            .lean();
          aiLogsStatus = "included";
        }
      } else {
        aiLogsStatus = "unavailable";
      }
    } catch (err) {
      console.warn("⚠️ Failed to export AI interaction logs from MongoDB:", err.message);
      aiLogsStatus = "unavailable";
    }
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
    version: "1.1.0",
    completeness: aiLogsStatus === "unavailable" ? "partial" : "complete",
    dataSources: {
      relational: "postgresql",
      telemetry: aiLogsStatus,
    },
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
    aiInteractionHistory: aiLogs,
  };
};
