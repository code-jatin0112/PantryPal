import mongoose from "mongoose";

export const getMongoUri = () => {
  if (process.env.NODE_ENV === "test") {
    if (process.env.MONGO_TEST_URI) {
      return process.env.MONGO_TEST_URI;
    }
    if (process.env.MONGO_URI) {
      return process.env.MONGO_URI.replace("/pantrypal?", "/pantrypal_test?");
    }
    return null;
  }
  return process.env.MONGO_URI;
};

export const connectMongo = async () => {
  try {
    const mongoUri = getMongoUri();
    if (!mongoUri) {
      console.warn("⚠️ MONGO_URI is not defined in environment variables.");
      console.warn("⚠️ MongoDB integration is disabled. AI logs will not be saved to NoSQL.");
      return null;
    }

    if (process.env.NODE_ENV === "test") {
      const isTestDb =
        mongoUri.includes("test") ||
        mongoUri.includes("pantrypal_test");
      if (!isTestDb) {
        throw new Error(
          `CRITICAL MONGODB SAFETY ERROR: Refusing to run tests against non-test database: '${mongoUri}'. Dedicated test database required.`
        );
      }
    }

    mongoose.set("strictQuery", false);

    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB connected: ${connection.connection.host} (database: ${connection.connection.db?.databaseName})`);
    return connection;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    if (process.env.NODE_ENV === "test" && process.env.FAIL_FAST_TEST_MONGO === "true") {
      throw error;
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
    console.error("Error while disconnecting from MongoDB:", error);
  }
};
