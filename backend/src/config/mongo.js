import mongoose from "mongoose";

export const connectMongo = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.warn("⚠️ MONGO_URI is not defined in environment variables.");
      console.warn("⚠️ MongoDB integration is disabled. AI logs will not be saved to NoSQL.");
      return null;
    }

    mongoose.set("strictQuery", false);

    const connection = await mongoose.connect(mongoUri);

    console.log(`✅ MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    // We don't exit the process here so that PostgreSQL can still run independently
    // process.exit(1);
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
