import "dotenv/config";
import app from "./app.js";
import prisma from "./config/database.js";
import { connectMongo, disconnectMongo } from "./config/mongo.js";
import { reconcilePendingAccountDeletions } from "./services/authService.js";
import { sanitizeDatabaseUrl } from "./utils/testDatabaseGuard.js";

const PORT = process.env.PORT || 3000;

// Initialize NoSQL connection safely
try {
  await connectMongo();
} catch (mongoErr) {
  console.warn("Initial MongoDB connection skipped:", sanitizeDatabaseUrl(mongoErr.message));
}

// Durable Deletion Reconciliation: Recover any pending accounts across restarts safely
try {
  await reconcilePendingAccountDeletions();
} catch (err) {
  console.warn("Initial deletion reconciliation skipped:", sanitizeDatabaseUrl(err.message));
}

// Schedule periodic reconciliation safely wrapped to catch and log any asynchronous errors
const RECONCILIATION_INTERVAL_MS = 5 * 60 * 1000;
const reconciliationTimer = setInterval(async () => {
  try {
    await reconcilePendingAccountDeletions();
  } catch (intervalErr) {
    console.error(
      "[Worker] Periodic account deletion reconciliation failed:",
      sanitizeDatabaseUrl(intervalErr.message)
    );
  }
}, RECONCILIATION_INTERVAL_MS).unref();

const server = app.listen(PORT, () => {
  console.log(`PantryPal backend running on port ${PORT}`);
});

const handleGracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  clearInterval(reconciliationTimer);

  server.close(async (err) => {
    if (err) {
      console.error("Error while closing HTTP server:", sanitizeDatabaseUrl(err.message || String(err)));
      process.exit(1);
    }

    try {
      console.log("Closing database connections...");
      await prisma.$disconnect();
      await disconnectMongo();
      console.log("Database connections closed cleanly.");
      process.exit(0);
    } catch (dbErr) {
      console.error("Error while disconnecting from database:", sanitizeDatabaseUrl(dbErr.message || String(dbErr)));
      process.exit(1);
    }
  });

  // Force shutdown if cleanup takes longer than 10 seconds
  setTimeout(() => {
    console.error("Graceful shutdown timed out. Forcing exit.");
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGINT", () => handleGracefulShutdown("SIGINT"));
process.on("SIGTERM", () => handleGracefulShutdown("SIGTERM"));
