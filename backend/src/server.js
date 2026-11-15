import "dotenv/config";
import app from "./app.js";
import prisma from "./config/database.js";
import { connectMongo, disconnectMongo } from "./config/mongo.js";
import { reconcilePendingAccountDeletions } from "./services/authService.js";

const PORT = process.env.PORT || 3000;

// Initialize NoSQL connection
await connectMongo();

// Durable Deletion Reconciliation: Recover any pending accounts across restarts
await reconcilePendingAccountDeletions().catch((err) =>
  console.warn("Initial deletion reconciliation skipped:", err.message)
);

// Schedule periodic reconciliation every 5 minutes
setInterval(reconcilePendingAccountDeletions, 5 * 60 * 1000).unref();

const server = app.listen(PORT, () => {
  console.log(`PantryPal backend running on port ${PORT}`);
});

const handleGracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

  server.close(async (err) => {
    if (err) {
      console.error("Error while closing HTTP server:", err);
      process.exit(1);
    }

    try {
      console.log("Closing database connections...");
      await prisma.$disconnect();
      await disconnectMongo();
      console.log("Database connections closed cleanly.");
      process.exit(0);
    } catch (dbErr) {
      console.error("Error while disconnecting from database:", dbErr);
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