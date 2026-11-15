import prisma from "../config/database.js";
import { sanitizeDatabaseUrl } from "./testDatabaseGuard.js";

/**
 * Persist or update a durable deletion obligation that survives process restarts
 * and does not depend on a PostgreSQL User row.
 */
export const recordDeletionObligation = async ({
  userId,
  targetCollection = "ALL",
  documentId = null,
  status = "PENDING",
  error = null,
}) => {
  const lastError = error ? sanitizeDatabaseUrl(String(error)) : null;

  // 1. Durably record in PostgreSQL AccountDeletionObligation
  try {
    await prisma.accountDeletionObligation.upsert({
      where: { userId },
      create: {
        userId,
        targetCollection,
        documentId: documentId ? String(documentId) : null,
        status,
        lastError,
      },
      update: {
        targetCollection,
        documentId: documentId ? String(documentId) : null,
        status,
        lastError,
      },
    });
  } catch (pgErr) {
    console.error(
      "[DataErasure] Failed to persist obligation to PostgreSQL:",
      sanitizeDatabaseUrl(pgErr.message)
    );
  }

  // 2. Durably record in MongoDB DeletionObligation (if MongoDB is connected)
  try {
    const { DeletionObligation } = await import("../models/DeletionObligation.js");
    await DeletionObligation.findOneAndUpdate(
      { userId },
      {
        userId,
        targetCollection,
        documentId: documentId ? String(documentId) : null,
        status,
        lastError,
      },
      { upsert: true, returnDocument: "after" }
    );
  } catch (mongoErr) {
    console.warn(
      "[DataErasure] Failed to persist obligation to MongoDB:",
      sanitizeDatabaseUrl(mongoErr.message)
    );
  }
};

/**
 * Remove or finalize completed deletion obligations across PostgreSQL and MongoDB.
 */
export const resolveDeletionObligation = async (userId) => {
  try {
    await prisma.accountDeletionObligation.deleteMany({
      where: { userId },
    });
  } catch (pgErr) {
    console.warn(
      "[DataErasure] Failed to remove obligation from PostgreSQL:",
      sanitizeDatabaseUrl(pgErr.message)
    );
  }

  try {
    const { DeletionObligation } = await import("../models/DeletionObligation.js");
    await DeletionObligation.deleteMany({ userId });
  } catch (mongoErr) {
    console.warn(
      "[DataErasure] Failed to remove obligation from MongoDB:",
      sanitizeDatabaseUrl(mongoErr.message)
    );
  }
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

      // 3. Check if an active deletion obligation exists
      const [obligation] = await tx.$queryRaw`
        SELECT id, status FROM "AccountDeletionObligation" WHERE "userId" = ${userId}
      `;

      if (obligation) {
        console.warn(
          `[DataErasure] Blocked persist for user ${userId}: active deletion obligation found (${obligation.status}).`
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
      // Verify that the user was not concurrently deactivated or queued for deletion
      let stillActive = true;
      try {
        const [verifyRow] = await tx.$queryRaw`
          SELECT id, "isActive", "deletionStatus" FROM "User" WHERE id = ${userId}
        `;
        const [verifyObligation] = await tx.$queryRaw`
          SELECT id FROM "AccountDeletionObligation" WHERE "userId" = ${userId}
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
          // DO NOT SWALLOW: Record durable obligation and throw
          console.error(
            `[DataErasure] CRITICAL: Compensating rollback failed for doc ${createdDoc._id}:`,
            rollbackErr.message
          );
          await recordDeletionObligation({
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
