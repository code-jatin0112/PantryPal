import prisma from "../config/database.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateAccessToken } from "../utils/token.js";
import AppError from "../utils/AppError.js";
import { sanitizeDatabaseUrl } from "../utils/testDatabaseGuard.js";
import {
  recordDeletionObligation,
  resolveDeletionObligation,
} from "../utils/dataErasureCoordinator.js";

export const cleanUserMongoData = async (targetUserId) => {
  const { default: mongoose } = await import("mongoose");
  const { connectMongo } = await import("../config/mongo.js");
  if (mongoose.connection.readyState === 0) {
    await connectMongo();
  }
  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB connection unavailable");
  }
  const { AiInteractionLog } = await import("../models/AiInteractionLog.js");
  const { UnstructuredRecipe } = await import("../models/UnstructuredRecipe.js");

  const tasks = [];
  if (AiInteractionLog) {
    tasks.push(AiInteractionLog.deleteMany({ userId: targetUserId }));
  }
  if (UnstructuredRecipe) {
    tasks.push(UnstructuredRecipe.deleteMany({ userId: targetUserId }));
  }
  await Promise.all(tasks);
};

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

  const isSamePassword = await comparePassword(newPassword, user.password);
  if (isSamePassword) {
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

  let deletionSuccess = false;
  let cleanupError = null;

  await prisma.$transaction(
    async (tx) => {
      // 1. Acquire transaction-level advisory lock on userId across all processes
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtext(${ "pantrypal_user_lock" }), hashtext(${userId}))
      `;

      // 2. Immediately transition to durable PENDING_DELETION state
      // This locks out the account and revokes active sessions across all routes
      await tx.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          deletionStatus: "PENDING_DELETION",
          tokenVersion: { increment: 1 },
        },
      });

      // 3. Durably record deletion obligation before deleting user row
      await recordDeletionObligation({
        userId,
        targetCollection: "ALL",
        status: "IN_PROGRESS",
      });

      // 4. Clean up NoSQL telemetry and AI recipes (MongoDB)
      let mongoSuccess = true;
      if (process.env.MONGO_URI || process.env.MONGO_TEST_URI) {
        try {
          await cleanUserMongoData(userId);
        } catch (mongoErr) {
          console.error(
            "Failed to delete MongoDB data during account deletion:",
            sanitizeDatabaseUrl(mongoErr.message)
          );
          mongoSuccess = false;
          cleanupError = mongoErr;
        }
      }

      if (!mongoSuccess) {
        await tx.user.update({
          where: { id: userId },
          data: { deletionStatus: "DELETION_FAILED" },
        });
        await recordDeletionObligation({
          userId,
          targetCollection: "ALL",
          status: "FAILED",
          error: cleanupError?.message || "MongoDB cleanup failed",
        });
        return;
      }

      // 5. PostgreSQL transactional cascade deletion
      await tx.user.delete({
        where: { id: userId },
      });

      // 6. Resolve completed deletion obligation
      await resolveDeletionObligation(userId);
      deletionSuccess = true;
    },
    { timeout: 30000 }
  );

  if (!deletionSuccess) {
    throw new AppError(
      "Account entered pending deletion, but NoSQL telemetry cleanup failed. Please retry to complete deletion.",
      502,
      "TELEMETRY_CLEANUP_FAILED"
    );
  }

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

  let retrySuccess = false;
  let cleanupError = null;

  await prisma.$transaction(
    async (tx) => {
      // 1. Acquire transaction-level advisory lock
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtext(${ "pantrypal_user_lock" }), hashtext(${user.id}))
      `;

      // 2. Re-verify inside lock
      const [freshUser] = await tx.$queryRaw`
        SELECT id, "deletionStatus" FROM "User" WHERE id = ${user.id}
      `;
      if (!freshUser || !allowedDeletionStatuses.includes(freshUser.deletionStatus)) {
        retrySuccess = true;
        return;
      }

      // 3. Mark obligation IN_PROGRESS
      await recordDeletionObligation({
        userId: user.id,
        targetCollection: "ALL",
        status: "IN_PROGRESS",
      });

      // 4. Attempt NoSQL cleanup
      let mongoSuccess = true;
      if (process.env.MONGO_URI || process.env.MONGO_TEST_URI) {
        try {
          await cleanUserMongoData(user.id);
        } catch (err) {
          console.warn("MongoDB retry cleanup failed:", sanitizeDatabaseUrl(err.message));
          mongoSuccess = false;
          cleanupError = err;
        }
      }

      if (!mongoSuccess) {
        await tx.user.update({
          where: { id: user.id },
          data: { deletionStatus: "DELETION_FAILED" },
        });
        await recordDeletionObligation({
          userId: user.id,
          targetCollection: "ALL",
          status: "FAILED",
          error: cleanupError?.message || "MongoDB cleanup failed during retry",
        });
        return;
      }

      // 5. PostgreSQL transactional cascade deletion
      await tx.user.delete({
        where: { id: user.id },
      });

      // 6. Resolve obligation
      await resolveDeletionObligation(user.id);
      retrySuccess = true;
    },
    { timeout: 30000 }
  );

  if (!retrySuccess) {
    throw new AppError(
      "Telemetry cleanup failed during retry. Account remains locked in deletion state. Please retry or wait for background recovery.",
      502,
      "TELEMETRY_CLEANUP_FAILED"
    );
  }

  return {
    status: "COMPLETED",
    message: "Account and associated data deleted successfully",
  };
};

let isReconciliationRunning = false;

/**
 * Server-side durable scheduled reconciliation.
 * Automatically recovers pending accounts across process restarts or network outages.
 * Guarantees no overlapping runs and never throws unhandled rejections during outages.
 */
export const reconcilePendingAccountDeletions = async () => {
  if (isReconciliationRunning) {
    console.log("[Reconciliation] Run skipped: previous reconciliation is still in progress.");
    return { reconciled: 0, failed: 0, skipped: true };
  }

  isReconciliationRunning = true;
  try {
    // 1. Query pending accounts from PostgreSQL User
    let pendingUsers = [];
    try {
      pendingUsers = await prisma.user.findMany({
        where: {
          deletionStatus: { in: ["PENDING_DELETION", "DELETION_FAILED"] },
        },
        select: {
          id: true,
          email: true,
          deletionStatus: true,
        },
      });
    } catch (queryErr) {
      console.error(
        "[Reconciliation] Failed to query pending accounts (temporary database outage):",
        sanitizeDatabaseUrl(queryErr.message)
      );
      return { reconciled: 0, failed: 0, error: sanitizeDatabaseUrl(queryErr.message) };
    }

    // 2. Query durable deletion obligations from PostgreSQL
    let pgObligations = [];
    try {
      pgObligations = await prisma.accountDeletionObligation.findMany({
        where: {
          status: { in: ["PENDING", "FAILED", "IN_PROGRESS"] },
        },
        select: { userId: true },
      });
    } catch (pgObErr) {
      console.warn(
        "[Reconciliation] Failed to query PostgreSQL obligations:",
        sanitizeDatabaseUrl(pgObErr.message)
      );
    }

    // 3. Query durable deletion obligations from MongoDB (if available)
    let mongoObligations = [];
    if (process.env.MONGO_URI || process.env.MONGO_TEST_URI) {
      try {
        const { default: mongoose } = await import("mongoose");
        const { connectMongo } = await import("../config/mongo.js");
        if (mongoose.connection.readyState === 0) {
          await connectMongo();
        }
        if (mongoose.connection.readyState === 1) {
          const { DeletionObligation } = await import("../models/DeletionObligation.js");
          if (DeletionObligation) {
            mongoObligations = await DeletionObligation.find({
              status: { $in: ["PENDING", "FAILED", "IN_PROGRESS"] },
            }).select("userId").lean();
          }
        }
      } catch (mongoObErr) {
        console.warn(
          "[Reconciliation] Failed to query MongoDB obligations:",
          sanitizeDatabaseUrl(mongoObErr.message)
        );
      }
    }

    // Deduplicate user IDs across all sources
    const targetUserIds = [
      ...new Set([
        ...pendingUsers.map((u) => u.id),
        ...pgObligations.map((o) => o.userId),
        ...mongoObligations.map((o) => o.userId),
      ]),
    ];

    if (!targetUserIds || targetUserIds.length === 0) {
      return { reconciled: 0, failed: 0 };
    }

    console.log(`[Reconciliation] Found ${targetUserIds.length} target(s) for deletion reconciliation.`);

    let reconciled = 0;
    let failed = 0;

    for (const targetUserId of targetUserIds) {
      try {
        await prisma.$transaction(
          async (tx) => {
            // Acquire transaction-level advisory lock
            await tx.$executeRaw`
              SELECT pg_advisory_xact_lock(hashtext(${ "pantrypal_user_lock" }), hashtext(${targetUserId}))
            `;

            // Check if user still exists in PostgreSQL
            const [freshUser] = await tx.$queryRaw`
              SELECT id, "deletionStatus" FROM "User" WHERE id = ${targetUserId}
            `;

            // Clean up MongoDB data
            let mongoSuccess = true;
            let cleanupErr = null;
            if (process.env.MONGO_URI || process.env.MONGO_TEST_URI) {
              try {
                await cleanUserMongoData(targetUserId);
              } catch (err) {
                console.warn(
                  `[Reconciliation] MongoDB cleanup failed for user ${targetUserId}:`,
                  sanitizeDatabaseUrl(err.message)
                );
                mongoSuccess = false;
                cleanupErr = err;
              }
            }

            if (mongoSuccess) {
              // Delete PostgreSQL User if still present
              if (freshUser) {
                try {
                  await tx.user.delete({ where: { id: targetUserId } });
                } catch (delErr) {
                  if (delErr.code !== "P2025") {
                    throw delErr;
                  }
                }
              }
              // Resolve durable obligations across PostgreSQL and MongoDB
              await resolveDeletionObligation(targetUserId);
              console.log(`[Reconciliation] Successfully finalized deletion for user ${targetUserId}`);
              reconciled++;
            } else {
              if (freshUser) {
                await tx.user.update({
                  where: { id: targetUserId },
                  data: { deletionStatus: "DELETION_FAILED" },
                });
              }
              await recordDeletionObligation({
                userId: targetUserId,
                targetCollection: "ALL",
                status: "FAILED",
                error: cleanupErr?.message || "Reconciliation MongoDB cleanup failed",
              });
              failed++;
            }
          },
          { timeout: 30000 }
        );
      } catch (userErr) {
        console.error(
          `[Reconciliation] Error reconciling user ${targetUserId}:`,
          sanitizeDatabaseUrl(userErr.message)
        );
        failed++;
      }
    }

    return { reconciled, failed };
  } catch (unexpectedErr) {
    console.error("[Reconciliation] Unexpected error during reconciliation:", sanitizeDatabaseUrl(unexpectedErr.message));
    return { reconciled: 0, failed: 0, error: sanitizeDatabaseUrl(unexpectedErr.message) };
  } finally {
    isReconciliationRunning = false;
  }
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

  // Fetch MongoDB AI interaction history and generated recipes scoped strictly to userId
  let aiLogs = [];
  let unstructuredRecipes = [];
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
        const { UnstructuredRecipe } = await import("../models/UnstructuredRecipe.js");
        const [logs, recipes] = await Promise.all([
          AiInteractionLog ? AiInteractionLog.find({ userId }).select("-_id -__v").lean() : [],
          UnstructuredRecipe ? UnstructuredRecipe.find({ userId }).select("-_id -__v").lean() : [],
        ]);
        aiLogs = logs || [];
        unstructuredRecipes = recipes || [];
        aiLogsStatus = "included";
      } else {
        aiLogsStatus = "unavailable";
      }
    } catch (err) {
      console.warn("⚠️ Failed to export AI interaction logs from MongoDB:", sanitizeDatabaseUrl(err.message));
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
      unstructuredRecipes: aiLogsStatus,
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
    unstructuredRecipes,
    aiGeneratedRecipes: unstructuredRecipes,
  };
};
