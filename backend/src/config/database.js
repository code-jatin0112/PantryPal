import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { isAuthorizedPostgresTestUrl, sanitizeDatabaseUrl } from "../utils/testDatabaseGuard.js";

let connectionString = process.env.DATABASE_URL;

if (process.env.NODE_ENV === "test") {
  const testUrl = process.env.TEST_DATABASE_URL;
  if (!testUrl) {
    throw new Error(
      "CRITICAL TEST DATABASE SAFETY ERROR: TEST_DATABASE_URL must be explicitly configured in test environment."
    );
  }
  if (!isAuthorizedPostgresTestUrl(testUrl)) {
    const sanitized = sanitizeDatabaseUrl(testUrl);
    throw new Error(
      `CRITICAL TEST DATABASE SAFETY ERROR: TEST_DATABASE_URL '${sanitized}' failed test safety authorization.`
    );
  }
  connectionString = testUrl;
  process.env.DATABASE_URL = testUrl;
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

export default prisma;
