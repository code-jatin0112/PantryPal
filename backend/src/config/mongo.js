import mongoose from "mongoose";
import {
  isAuthorizedMongoTestUri,
  APPROVED_TEST_DB_NAME,
  sanitizeDatabaseUrl,
} from "../utils/testDatabaseGuard.js";

export const getMongoUri = () => {
  if (process.env.NODE_ENV === "test") {
    // Strictly require MONGO_TEST_URI without implicit fallbacks
    return process.env.MONGO_TEST_URI || null;
  }
  return process.env.MONGO_URI;
};

export const connectMongo = async () => {
  try {
    const mongoUri = getMongoUri();
    if (!mongoUri) {
      if (process.env.NODE_ENV === "test") {
        throw new Error(
          "CRITICAL MONGODB SAFETY ERROR: MONGO_TEST_URI is required in test environment. Implicit fallbacks are disabled."
        );
      }
      console.warn("⚠️ MONGO_URI is not defined in environment variables.");
      console.warn("⚠️ MongoDB integration is disabled. AI logs will not be saved to NoSQL.");
      return null;
    }

    if (process.env.NODE_ENV === "test") {
      if (!isAuthorizedMongoTestUri(mongoUri)) {
        const sanitized = sanitizeDatabaseUrl(mongoUri);
        throw new Error(
          `CRITICAL MONGODB SAFETY ERROR: Refusing to run tests against unauthorized database: '${sanitized}'. ` +
          `Dedicated test database '${APPROVED_TEST_DB_NAME}' on approved test hosts is required.`
        );
      }
    }

    mongoose.set("strictQuery", false);

    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    const activeDbName = connection.connection.db?.databaseName;
    if (process.env.NODE_ENV === "test" && activeDbName !== APPROVED_TEST_DB_NAME) {
      await mongoose.disconnect();
      throw new Error(
        `CRITICAL MONGODB SAFETY ERROR: Connected to database '${activeDbName}', but expected exact test database '${APPROVED_TEST_DB_NAME}'. Refusing connection.`
      );
    }

    console.log(`✅ MongoDB connected: ${connection.connection.host} (database: ${activeDbName})`);
    return connection;
  } catch (error) {
    const sanitizedMsg = sanitizeDatabaseUrl(error.message);
    console.error(`❌ MongoDB connection error: ${sanitizedMsg}`);
    if (process.env.NODE_ENV === "test") {
      throw new Error(sanitizedMsg);
    }
    return null;
  }
};

export const disconnectMongo = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("MongoDB connection closed cleanly.");
    }
  } catch (error) {
    console.error("Error while disconnecting from MongoDB:", sanitizeDatabaseUrl(error.message));
  }
};
