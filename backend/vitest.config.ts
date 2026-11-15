import { defineConfig } from "vitest/config";

// Enforce dedicated test database environments
process.env.NODE_ENV = "test";
process.env.TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://jatinkashyap@localhost:5432/pantrypal_test?schema=public";
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

if (process.env.MONGO_URI && !process.env.MONGO_TEST_URI) {
  process.env.MONGO_TEST_URI = process.env.MONGO_URI.replace(
    "/pantrypal?",
    "/pantrypal_test?"
  );
}
if (process.env.MONGO_TEST_URI) {
  process.env.MONGO_URI = process.env.MONGO_TEST_URI;
}

const testDbUrl =
  process.env.TEST_DATABASE_URL ||
  "postgresql://jatinkashyap@localhost:5432/pantrypal_test?schema=public";

const testMongoUri =
  process.env.MONGO_TEST_URI ||
  (process.env.MONGO_URI
    ? process.env.MONGO_URI.replace("/pantrypal?", "/pantrypal_test?")
    : "mongodb://localhost:27017/pantrypal_test");

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 20000,
    setupFiles: ["./tests/setup.js"],
    env: {
      NODE_ENV: "test",
      TEST_DATABASE_URL: testDbUrl,
      DATABASE_URL: testDbUrl,
      MONGO_TEST_URI: testMongoUri,
      MONGO_URI: testMongoUri,
    },
  },
});


