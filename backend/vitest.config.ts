import { defineConfig } from "vitest/config";
import "dotenv/config";

process.env.NODE_ENV = "test";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 20000,
    setupFiles: ["./tests/setup.js"],
    env: {
      NODE_ENV: "test",
      TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || "",
      DATABASE_URL: process.env.TEST_DATABASE_URL || "",
      MONGO_TEST_URI: process.env.MONGO_TEST_URI || "",
      MONGO_URI: process.env.MONGO_TEST_URI || "",
    },
  },
});
