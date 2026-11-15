import prisma from "../config/database.js";
import { sanitizeDatabaseUrl } from "./testDatabaseGuard.js";

/**
 * Deterministically compute the unique obligation key.
 * Prevents multiple document-level obligations for the same user from overwriting each other,
 * and cleanly distinguishes ACCOUNT_DELETION obligations from DOCUMENT_CLEANUP obligations.
 */
export const computeObligationKey = ({
  type = "ACCOUNT_DELETION",
  userId,
  targetCollection = "ALL",
  documentId = null,
}) => {
  if (type === "ACCOUNT_DELETION") {
    return `ACCOUNT:${userId}`;
  }
  return `DOC:${userId}:${targetCollection}:${documentId || "UNKNOWN"}`;
};

/**
 * Persist or update a durable deletion obligation that survives process restarts
 * and does not depend on a PostgreSQL User row.
 *
 * Guarantees:
 * - Differentiates ACCOUNT_DELETION from DOCUMENT_CLEANUP
 * - Prevents multiple document obligations for the same user from colliding
 * - Throws if neither PostgreSQL nor MongoDB could persist the obligation (never falsely claims durability)
 */
export const recordDeletionObligation = async ({
  tx = null,
  type = "ACCOUNT_DELETION",
  userId,
  targetCollection = "ALL",
  documentId = null,
  status = "PENDING",
  error = null,
}) => {
  if (!userId) {
    throw new Error("User ID is required to record a deletion obligation");
  }

  const obligationKey = computeObligationKey({
    type,
    userId,
    targetCollection,
    documentId,
  });
  const lastError = error ? sanitizeDatabaseUrl(String(error)) : null;

  let pgSuccess = false;
  let mongoSuccess = false;
  let pgError = null;
  let mongoError = null;

  // 1. Durably record in PostgreSQL AccountDeletionObligation
  const pgClient = tx || prisma;
  try {
    await pgClient.accountDeletionObligation.upsert({
      where: { obligationKey },
      create: {
        obligationKey,
        type,
        userId,
        targetCollection,
        documentId: documentId ? String(documentId) : null,
        status,
        lastError,
      },
      update: {
        type,
        userId,
        targetCollection,
        documentId: documentId ? String(documentId) : null,
        status,
        lastError,
      },
    });
    pgSuccess = true;
  } catch (err) {
    pgError = err;
    console.error(
      "[DataErasure] Failed to persist obligation to PostgreSQL:",
      sanitizeDatabaseUrl(err.message)
    );
  }

  // 2. Durably record in MongoDB DeletionObligation (if MongoDB is connected / configured)
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
          await DeletionObligation.findOneAndUpdate(
            { obligationKey },
            {
              obligationKey,
              type,
              userId,
              targetCollection,
              documentId: documentId ? String(documentId) : null,
              status,
              lastError,
            },
            { upsert: true, returnDocument: "after" }
          );
          mongoSuccess = true;
        }
      }
    } catch (err) {
      mongoError = err;
      console.warn(
        "[DataErasure] Failed to persist obligation to MongoDB:",
        sanitizeDatabaseUrl(err.message)
      );
    }
  }

  // CRITICAL DURABILITY GUARD:
  // If neither datastore persisted the obligation, throw immediately.
  // Never falsely claim durable recovery when persistence fails across all stores.
  if (!pgSuccess && !mongoSuccess) {
    const errorMsg = `CRITICAL: Failed to durably persist deletion obligation to any datastore. PG error: ${pgError?.message}; Mongo error: ${mongoError?.message}`;
    console.error(`[DataErasure] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  return { obligationKey, pgSuccess, mongoSuccess };
};

/**
 * Transactionally remove or finalize completed deletion obligations in PostgreSQL.
 * If running inside a transaction (tx), the marker removal commits ONLY when tx commits.
 */
export const resolvePostgresDeletionObligation = async ({
  tx = null,
  obligationKey = null,
  userId = null,
  type = null,
} = {}) => {
  const pgClient = tx || prisma;
  try {
    const where = {};
    if (obligationKey) {
      where.obligationKey = obligationKey;
    } else if (userId) {
      where.userId = userId;
      if (type) {
        where.type = type;
      }
    } else {
      return;
    }
    await pgClient.accountDeletionObligation.deleteMany({ where });
  } catch (err) {
    console.warn(
      "[DataErasure] Failed to remove obligation from PostgreSQL:",
      sanitizeDatabaseUrl(err.message)
    );
    if (tx) {
      throw err;
    }
  }
};

/**
 * Remove completed deletion obligations from MongoDB.
 * MUST be executed ONLY AFTER the PostgreSQL transaction has committed.
 */
export const resolveMongoDeletionObligation = async ({
  obligationKey = null,
  userId = null,
  type = null,
} = {}) => {
  if (!process.env.MONGO_URI && !process.env.MONGO_TEST_URI) {
    return;
  }
  try {
    const { default: mongoose } = await import("mongoose");
    const { connectMongo } = await import("../config/mongo.js");
    if (mongoose.connection.readyState === 0) {
      await connectMongo();
    }
    if (mongoose.connection.readyState === 1) {
      const { DeletionObligation } = await import("../models/DeletionObligation.js");
      if (DeletionObligation) {
        const filter = {};
        if (obligationKey) {
          filter.obligationKey = obligationKey;
        } else if (userId) {
          filter.userId = userId;
          if (type) {
            filter.type = type;
          }
        } else {
          return;
        }
        await DeletionObligation.deleteMany(filter);
      }
    }
  } catch (err) {
    console.warn(
      "[DataErasure] Failed to remove obligation from MongoDB:",
      sanitizeDatabaseUrl(err.message)
    );
  }
};

/**
 * Remove or finalize completed deletion obligations across PostgreSQL and MongoDB.
 */
export const resolveDeletionObligation = async (target) => {
  const params = typeof target === "string" ? { userId: target } : target;
  await resolvePostgresDeletionObligation(params);
  await resolveMongoDeletionObligation(params);
};

/**
 * Race-safe gate for persisting user-owned MongoDB documents.
 * Ensures in-flight operations cannot persist records once account deletion has been initiated.
 *
 * Coordinates across backend processes via PostgreSQL transaction-scoped advisory lock.
 */
export const safePersistUserMongoRecord = async ({
  userId,
  targetCollection, // 'UnstructuredRecipe' | 'AiInteractionLog'
  createRecordFn,   // () => Promise<createdDoc>
}) => {
  if (!userId) {
    return null;
  }

  return await prisma.$transaction(
    async (tx) => {
      // 1. Acquire transaction-level advisory lock on userId across all processes
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtext(${ "pantrypal_user_lock" }), hashtext(${userId}))
      `;

      // 2. Check user active status in PostgreSQL
      const [userRow] = await tx.$queryRaw`
        SELECT id, "isActive", "deletionStatus" FROM "User" WHERE id = ${userId}
      `;

      if (!userRow || !userRow.isActive || userRow.deletionStatus) {
        console.warn(
          `[DataErasure] Blocked persist for user ${userId}: user is deleted or pending deletion (${userRow?.deletionStatus || "NOT_FOUND"}).`
        );
        return null;
      }

      // 3. Check if an active account deletion obligation exists
      // Note: DOCUMENT_CLEANUP obligations do NOT block active users from using AI features!
      const [obligation] = await tx.$queryRaw`
        SELECT id, status FROM "AccountDeletionObligation" WHERE "userId" = ${userId} AND "type" = 'ACCOUNT_DELETION'
      `;

      if (obligation) {
        console.warn(
          `[DataErasure] Blocked persist for user ${userId}: active account deletion obligation found (${obligation.status}).`
        );
        return null;
      }

      // 4. While holding the exclusive advisory lock, execute the MongoDB creation
      let createdDoc = null;
      try {
        createdDoc = await createRecordFn();
      } catch (createErr) {
        console.warn(
          `[DataErasure] MongoDB create skipped/failed for user ${userId}:`,
          createErr.message
        );
        return null;
      }

      if (!createdDoc) {
        return null;
      }

      // 5. Post-write verification fence:
      // Verify that the user was not concurrently deactivated or queued for account deletion
      let stillActive = true;
      try {
        const [verifyRow] = await tx.$queryRaw`
          SELECT id, "isActive", "deletionStatus" FROM "User" WHERE id = ${userId}
        `;
        const [verifyObligation] = await tx.$queryRaw`
          SELECT id FROM "AccountDeletionObligation" WHERE "userId" = ${userId} AND "type" = 'ACCOUNT_DELETION'
        `;
        if (
          !verifyRow ||
          !verifyRow.isActive ||
          verifyRow.deletionStatus ||
          verifyObligation
        ) {
          stillActive = false;
        }
      } catch (verifyErr) {
        console.error(
          "[DataErasure] Post-write verification query failed:",
          verifyErr.message
        );
        stillActive = false;
      }

      if (!stillActive) {
        console.warn(
          `[DataErasure] User ${userId} is no longer active after persist. Executing compensating rollback for doc ${createdDoc._id}...`
        );
        try {
          if (targetCollection === "UnstructuredRecipe") {
            const { UnstructuredRecipe } = await import("../models/UnstructuredRecipe.js");
            await UnstructuredRecipe.deleteOne({ _id: createdDoc._id });
          } else if (targetCollection === "AiInteractionLog") {
            const { AiInteractionLog } = await import("../models/AiInteractionLog.js");
            await AiInteractionLog.deleteOne({ _id: createdDoc._id });
          }
          console.log(`[DataErasure] Successfully rolled back doc ${createdDoc._id}`);
          return null;
        } catch (rollbackErr) {
          // DO NOT SWALLOW: Record durable DOCUMENT_CLEANUP obligation and throw
          console.error(
            `[DataErasure] CRITICAL: Compensating rollback failed for doc ${createdDoc._id}:`,
            rollbackErr.message
          );
          await recordDeletionObligation({
            type: "DOCUMENT_CLEANUP",
            userId,
            targetCollection,
            documentId: String(createdDoc._id),
            status: "FAILED",
            error: `Compensating rollback failed: ${rollbackErr.message}`,
          });
          throw rollbackErr;
        }
      }

      return createdDoc;
    },
    { timeout: 15000 }
  );
};
