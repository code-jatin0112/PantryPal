import prisma from "../config/database.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateAccessToken } from "../utils/token.js";
import AppError from "../utils/AppError.js";
import { sanitizeDatabaseUrl } from "../utils/testDatabaseGuard.js";
import {
  computeObligationKey,
  recordDeletionObligation,
  resolvePostgresDeletionObligation,
  resolveMongoDeletionObligation,
  resolveDeletionObligation,
} from "../utils/dataErasureCoordinator.js";

export const cleanUserMongoData = async (targetUserId) => {
  const mongoUri =
    process.env.NODE_ENV === "test"
      ? (process.env.MONGO_TEST_URI || null)
      : process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MongoDB is unconfigured (missing connection URI)");
  }

  const { default: mongoose } = await import("mongoose");
  const { connectMongo } = await import("../config/mongo.js");
  if (mongoose.connection.readyState === 0) {
    await connectMongo();
  }
  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB connection unavailable (readyState !== 1)");
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

/**
 * Phase B: Destructive cleanup and finalization of an account queued for deletion.
 * Must only be invoked after Phase A has durably committed PENDING_DELETION intent.
 *
 * Guarantees:
 * 1. Acquires the transaction-level advisory lock on userId across all processes.
 * 2. Verifies committed deletion intent (freshUser.deletionStatus in ['PENDING_DELETION', 'DELETION_FAILED']).
 * 3. Safely handles stale markers for active users (clearing markers without deleting user or application data).
 * 4. Idempotently cleans up owned MongoDB records (cleanUserMongoData).
 * 5. If MongoDB is unconfigured or unavailable, fails closed: retains user in DELETION_FAILED and obligation in FAILED.
 * 6. Finalizes PostgreSQL User cascade deletion inside the same transaction.
 * 7. Transactionally resolves PostgreSQL AccountDeletionObligation inside tx.
 * 8. Resolves MongoDB DeletionObligation markers ONLY after the PostgreSQL transaction commits.
 */
export const finalizeAccountDeletion = async ({
  userId,
  _hookAfterMongoPurge = null,
}) => {
  const obligationKey = computeObligationKey({ type: "ACCOUNT_DELETION", userId });
  let finalized = false;
  let isStaleMarker = false;
  let cleanupError = null;

  await prisma.$transaction(
    async (tx) => {
      // 1. Acquire transaction-level advisory lock on userId across all processes
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtext(${ "pantrypal_user_lock" }), hashtext(${userId}))
      `;

      // 2. Query fresh user state from PostgreSQL inside lock
      const [freshUser] = await tx.$queryRaw`
        SELECT id, "isActive", "deletionStatus" FROM "User" WHERE id = ${userId}
      `;

      // If user does not exist in PostgreSQL (e.g. already deleted in previous run or orphan obligation)
      if (!freshUser) {
        // Idempotently purge any lingering MongoDB records
        try {
          await cleanUserMongoData(userId);
        } catch (err) {
          console.warn(
            `[Phase B] Lingering MongoDB cleanup for missing user ${userId}:`,
            sanitizeDatabaseUrl(err.message)
          );
        }
        await resolvePostgresDeletionObligation({
          tx,
          obligationKey,
          userId,
          type: "ACCOUNT_DELETION",
        });
        finalized = true;
        return;
      }

      // CRITICAL SAFETY GUARD:
      // If user exists in PostgreSQL, they MUST have deletionStatus of PENDING_DELETION or DELETION_FAILED!
      // If the user is active with no deletionStatus, NEVER DELETE!
      if (
        freshUser.deletionStatus !== "PENDING_DELETION" &&
        freshUser.deletionStatus !== "DELETION_FAILED"
      ) {
        console.warn(
          `[Phase B] SECURITY GUARD: User ${userId} exists and is active without deletionStatus. Skipping account deletion!`
        );
        // Clean up stale or spurious ACCOUNT_DELETION obligation marker in PostgreSQL inside tx
        await resolvePostgresDeletionObligation({
          tx,
          obligationKey,
          userId,
          type: "ACCOUNT_DELETION",
        });
        isStaleMarker = true;
        return;
      }

      // 3. Mark obligation IN_PROGRESS while executing finalization
      await recordDeletionObligation({
        tx,
        type: "ACCOUNT_DELETION",
        userId,
        targetCollection: "ALL",
        status: "IN_PROGRESS",
      });

      // 4. Perform idempotent cleanup of all owned MongoDB records
      let mongoSuccess = false;
      try {
        await cleanUserMongoData(userId);
        mongoSuccess = true;
      } catch (mongoErr) {
        console.error(
          `[Phase B] MongoDB cleanup failed for user ${userId}:`,
          sanitizeDatabaseUrl(mongoErr.message)
        );
        mongoSuccess = false;
        cleanupError = mongoErr;
      }

      // 5. Fail closed if MongoDB is unconfigured or unavailable
      if (!mongoSuccess) {
        await tx.user.update({
          where: { id: userId },
          data: { deletionStatus: "DELETION_FAILED" },
        });
        await recordDeletionObligation({
          tx,
          type: "ACCOUNT_DELETION",
          userId,
          targetCollection: "ALL",
          status: "FAILED",
          error: sanitizeDatabaseUrl(cleanupError?.message || "MongoDB cleanup failed"),
        });
        return;
      }

      // Optional failure simulation hook after MongoDB purge before PostgreSQL finalization commit
      if (_hookAfterMongoPurge) {
        await _hookAfterMongoPurge(tx);
      }

      // 6. Finalize PostgreSQL account deletion transactionally
      try {
        await tx.user.delete({
          where: { id: userId },
        });
      } catch (delErr) {
        if (delErr.code !== "P2025") {
          throw delErr;
        }
      }

      // 7. Transactionally resolve PostgreSQL deletion obligation marker inside tx
      await resolvePostgresDeletionObligation({
        tx,
        obligationKey,
        userId,
        type: "ACCOUNT_DELETION",
      });

      finalized = true;
    },
    { timeout: 30000 }
  );

  if (isStaleMarker) {
    // Resolve MongoDB marker after PostgreSQL transaction commits
    await resolveMongoDeletionObligation({
      obligationKey,
      userId,
      type: "ACCOUNT_DELETION",
    });
    return { success: true, isStaleMarker: true };
  }

  if (!finalized) {
    return { success: false, error: cleanupError };
  }

  // 8. Resolve MongoDB recovery markers only after PostgreSQL commit
  await resolveMongoDeletionObligation({
    obligationKey,
    userId,
    type: "ACCOUNT_DELETION",
  });

  return { success: true };
};

export const deleteUserAccount = async ({
  userId,
  password,
  _hookBeforePhaseACommit = null,
  _hookAfterPhaseA = null,
  _hookAfterMongoPurge = null,
}) => {
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

  // ─────────────────────────────────────────────────────────────
  // PHASE A — DURABLY COMMIT DELETION INTENT
  // ─────────────────────────────────────────────────────────────
  await prisma.$transaction(
    async (tx) => {
      // 1. Acquire transaction-level advisory lock on userId across all processes
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtext(${ "pantrypal_user_lock" }), hashtext(${userId}))
      `;

      // 2. Immediately transition to durable PENDING_DELETION state
      // Locks out account and revokes active sessions across all routes
      await tx.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          deletionStatus: "PENDING_DELETION",
          tokenVersion: { increment: 1 },
        },
      });

      // 3. Durably persist ACCOUNT_DELETION recovery obligation
      await recordDeletionObligation({
        tx,
        type: "ACCOUNT_DELETION",
        userId,
        targetCollection: "ALL",
        status: "IN_PROGRESS",
      });

      // Optional failure simulation hook before Phase A commit
      if (_hookBeforePhaseACommit) {
        await _hookBeforePhaseACommit(tx);
      }
    },
    { timeout: 30000 }
  );

  // Optional failure simulation hook immediately after Phase A commit
  if (_hookAfterPhaseA) {
    await _hookAfterPhaseA();
  }

  // ─────────────────────────────────────────────────────────────
  // PHASE B — CLEANUP AND FINALIZATION
  // ─────────────────────────────────────────────────────────────
  const result = await finalizeAccountDeletion({
    userId,
    _hookAfterMongoPurge,
  });

  if (!result.success) {
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
    throw new AppError(
      "Account is not scheduled for deletion recovery. Normal accounts cannot be finalized via recovery.",
      400,
      "ACCOUNT_NOT_PENDING_DELETION"
    );
  }

  // ─────────────────────────────────────────────────────────────
  // PHASE B — CLEANUP AND FINALIZATION (RESUMED)
  // ─────────────────────────────────────────────────────────────
  const result = await finalizeAccountDeletion({ userId: user.id });

  if (!result.success) {
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
 * Automatically recovers pending accounts and failed document cleanups across process restarts or outages.
 *
 * Guarantees:
 * 1. Cleanly separates DOCUMENT_CLEANUP from ACCOUNT_DELETION.
 * 2. For DOCUMENT_CLEANUP: deletes ONLY the targeted MongoDB document; NEVER deletes the active PostgreSQL User or application data.
 * 3. For ACCOUNT_DELETION: verifies explicit deletion intent before finalizing account cascade.
 * 4. Transactional ordering: PostgreSQL markers are deleted on tx inside the transaction; MongoDB markers are deleted after commit.
 */
export const reconcilePendingAccountDeletions = async () => {
  if (isReconciliationRunning) {
    console.log("[Reconciliation] Run skipped: previous reconciliation is still in progress.");
    return { reconciled: 0, failed: 0, skipped: true };
  }

  isReconciliationRunning = true;
  try {
    let reconciled = 0;
    let failed = 0;

    // ─────────────────────────────────────────────────────────────
    // PART 1: DOCUMENT_CLEANUP OBLIGATIONS (Document-only cleanup)
    // ─────────────────────────────────────────────────────────────
    let pgDocObligations = [];
    try {
      pgDocObligations = await prisma.accountDeletionObligation.findMany({
        where: {
          type: "DOCUMENT_CLEANUP",
          status: { in: ["PENDING", "FAILED", "IN_PROGRESS"] },
        },
      });
    } catch (pgDocErr) {
      console.warn(
        "[Reconciliation] Failed to query PostgreSQL document obligations:",
        sanitizeDatabaseUrl(pgDocErr.message)
      );
    }

    let mongoDocObligations = [];
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
            mongoDocObligations = await DeletionObligation.find({
              type: "DOCUMENT_CLEANUP",
              status: { $in: ["PENDING", "FAILED", "IN_PROGRESS"] },
            }).lean();
          }
        }
      } catch (mongoDocErr) {
        console.warn(
          "[Reconciliation] Failed to query MongoDB document obligations:",
          sanitizeDatabaseUrl(mongoDocErr.message)
        );
      }
    }

    // Deduplicate document obligations by obligationKey
    const docObligationsMap = new Map();
    for (const ob of [...pgDocObligations, ...mongoDocObligations]) {
      if (ob.obligationKey && !docObligationsMap.has(ob.obligationKey)) {
        docObligationsMap.set(ob.obligationKey, ob);
      }
    }

    if (docObligationsMap.size > 0) {
      console.log(`[Reconciliation] Found ${docObligationsMap.size} document cleanup obligation(s).`);
    }

    for (const [obligationKey, ob] of docObligationsMap.entries()) {
      const { userId, targetCollection, documentId } = ob;
      try {
        let docSuccess = false;

        // 1. Strict Target Validation: Reject invalid or incomplete cleanup targets
        if (!userId || !documentId || !targetCollection) {
          throw new Error(
            `Incomplete document cleanup target: userId=${userId || "missing"}, documentId=${documentId || "missing"}, targetCollection=${targetCollection || "missing"}`
          );
        }

        if (targetCollection !== "UnstructuredRecipe" && targetCollection !== "AiInteractionLog") {
          throw new Error(
            `Unsupported targetCollection for document cleanup: ${targetCollection}`
          );
        }

        // 2. Strict MongoDB Availability Check (never silently discard pending work)
        if (!process.env.MONGO_URI && !process.env.MONGO_TEST_URI) {
          throw new Error("MongoDB is unconfigured; preserving document cleanup obligation for future retry");
        }

        const { default: mongoose } = await import("mongoose");
        const { connectMongo } = await import("../config/mongo.js");
        if (mongoose.connection.readyState === 0) {
          await connectMongo();
        }
        if (mongoose.connection.readyState !== 1) {
          throw new Error("MongoDB is unavailable (connection not open); preserving document cleanup obligation for future retry");
        }

        await prisma.$transaction(
          async (tx) => {
            // Acquire advisory lock
            await tx.$executeRaw`
              SELECT pg_advisory_xact_lock(hashtext(${ "pantrypal_user_lock" }), hashtext(${userId}))
            `;

            // 3. Strict Document Ownership Verification & Scoped Deletion
            if (targetCollection === "UnstructuredRecipe") {
              const { UnstructuredRecipe } = await import("../models/UnstructuredRecipe.js");
              const existingDoc = await UnstructuredRecipe.findById(documentId).select("userId").lean();
              if (existingDoc && String(existingDoc.userId) !== String(userId)) {
                throw new Error(
                  `Cross-user document cleanup rejected: document ${documentId} belongs to user ${existingDoc.userId}, not ${userId}`
                );
              }
              // Require BOTH _id AND userId in deletion filter
              await UnstructuredRecipe.deleteOne({ _id: documentId, userId });
            } else if (targetCollection === "AiInteractionLog") {
              const { AiInteractionLog } = await import("../models/AiInteractionLog.js");
              const existingLog = await AiInteractionLog.findById(documentId).select("userId").lean();
              if (existingLog && String(existingLog.userId) !== String(userId)) {
                throw new Error(
                  `Cross-user document cleanup rejected: document ${documentId} belongs to user ${existingLog.userId}, not ${userId}`
                );
              }
              // Require BOTH _id AND userId in deletion filter
              await AiInteractionLog.deleteOne({ _id: documentId, userId });
            }

            // CRITICAL SAFETY GUARD:
            // NEVER delete or modify the PostgreSQL User!
            // NEVER delete any other application data!

            // Transactionally resolve PostgreSQL document obligation marker inside tx
            await resolvePostgresDeletionObligation({
              tx,
              obligationKey,
              userId,
              type: "DOCUMENT_CLEANUP",
            });
            docSuccess = true;
          },
          { timeout: 30000 }
        );

        if (docSuccess) {
          // Resolve MongoDB marker after transaction commits
          await resolveMongoDeletionObligation({
            obligationKey,
            userId,
            type: "DOCUMENT_CLEANUP",
          });
          console.log(`[Reconciliation] Successfully cleaned document ${documentId} (${targetCollection}) for user ${userId}`);
          reconciled++;
        }
      } catch (docErr) {
        console.error(
          `[Reconciliation] Failed document cleanup for ${obligationKey}:`,
          sanitizeDatabaseUrl(docErr.message)
        );
        try {
          await recordDeletionObligation({
            type: "DOCUMENT_CLEANUP",
            userId: userId || "UNKNOWN",
            targetCollection: targetCollection || "UNKNOWN",
            documentId: documentId ? String(documentId) : null,
            status: "FAILED",
            error: sanitizeDatabaseUrl(docErr.message),
          });
        } catch (recErr) {
          // Logged inside recordDeletionObligation
        }
        failed++;
      }
    }

    // ─────────────────────────────────────────────────────────────
    // PART 2: ACCOUNT_DELETION OBLIGATIONS (Full account finalization)
    // ─────────────────────────────────────────────────────────────
    // Query users with explicit deletion intent in PostgreSQL
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
      return { reconciled, failed, error: sanitizeDatabaseUrl(queryErr.message) };
    }

    // Query ACCOUNT_DELETION obligations from PostgreSQL
    let pgAccountObligations = [];
    try {
      pgAccountObligations = await prisma.accountDeletionObligation.findMany({
        where: {
          type: "ACCOUNT_DELETION",
          status: { in: ["PENDING", "FAILED", "IN_PROGRESS"] },
        },
        select: { userId: true, obligationKey: true },
      });
    } catch (pgObErr) {
      console.warn(
        "[Reconciliation] Failed to query PostgreSQL account obligations:",
        sanitizeDatabaseUrl(pgObErr.message)
      );
    }

    // Query ACCOUNT_DELETION obligations from MongoDB
    let mongoAccountObligations = [];
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
            mongoAccountObligations = await DeletionObligation.find({
              type: "ACCOUNT_DELETION",
              status: { $in: ["PENDING", "FAILED", "IN_PROGRESS"] },
            }).select("userId obligationKey").lean();
          }
        }
      } catch (mongoObErr) {
        console.warn(
          "[Reconciliation] Failed to query MongoDB account obligations:",
          sanitizeDatabaseUrl(mongoObErr.message)
        );
      }
    }

    // Deduplicate candidate account user IDs
    const candidateAccountUserIds = [
      ...new Set([
        ...pendingUsers.map((u) => u.id),
        ...pgAccountObligations.map((o) => o.userId),
        ...mongoAccountObligations.map((o) => o.userId),
      ]),
    ];

    if (candidateAccountUserIds.length > 0) {
      console.log(`[Reconciliation] Found ${candidateAccountUserIds.length} candidate account(s) for deletion reconciliation.`);
    }

    for (const targetUserId of candidateAccountUserIds) {
      try {
        const result = await finalizeAccountDeletion({ userId: targetUserId });
        if (result.success) {
          reconciled++;
          if (result.isStaleMarker) {
            console.log(
              `[Reconciliation] Safely cleared stale ACCOUNT_DELETION marker for active user ${targetUserId} across PostgreSQL and MongoDB`
            );
          } else {
            console.log(
              `[Reconciliation] Successfully finalized account deletion for user ${targetUserId}`
            );
          }
        } else {
          failed++;
        }
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
