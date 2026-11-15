import { beforeAll } from "vitest";
import prisma from "../src/config/database.js";
import { assertAuthorizedTestDatabase } from "../src/utils/testDatabaseGuard.js";

beforeAll(async () => {
  // Ensure test environment variables are propagated
  process.env.NODE_ENV = "test";
  if (!process.env.TEST_DATABASE_URL) {
    process.env.TEST_DATABASE_URL = "postgresql://jatinkashyap@localhost:5432/pantrypal_test?schema=public";
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
  if (process.env.MONGO_URI && !process.env.MONGO_URI.includes("test")) {
    process.env.MONGO_URI = process.env.MONGO_URI.replace("/pantrypal?", "/pantrypal_test?");
  }
  if (!process.env.MONGO_TEST_URI) {
    process.env.MONGO_TEST_URI = process.env.MONGO_URI;
  }

  // 1. Strict Fail-Closed Safety Guard: Assert dedicated test database authorization
  await assertAuthorizedTestDatabase(prisma);

  // 2. Deterministic, isolated test fixtures in test database only
  const mockUsers = [
    { id: "user-uuid-1234", email: "user-uuid-1234@pantrypal.test", name: "Mock User 1234" },
    { id: "11111111-1111-4111-8111-111111111111", email: "user-1111@pantrypal.test", name: "Mock User 1111" },
    { id: "22222222-2222-4222-8222-222222222222", email: "user-2222@pantrypal.test", name: "Mock User 2222" },
    { id: "user-uuid-100", email: "user-uuid-100@pantrypal.test", name: "Mock User 100" },
    { id: "user-uuid-200", email: "user-uuid-200@pantrypal.test", name: "Mock User 200" },
    { id: "user-uuid-fav-1", email: "user-uuid-fav-1@pantrypal.test", name: "Mock Fav User 1" },
    { id: "user-uuid-fav-2", email: "user-uuid-fav-2@pantrypal.test", name: "Mock Fav User 2" },
  ];

  for (const u of mockUsers) {
    try {
      await prisma.user.upsert({
        where: { id: u.id },
        update: {
          isActive: true,
          tokenVersion: 0,
          deletionStatus: null,
        },
        create: {
          id: u.id,
          email: u.email,
          name: u.name,
          password: "$2b$12$mockHashedPasswordForTestUsers123456789",
          isActive: true,
          tokenVersion: 0,
          deletionStatus: null,
        },
      });
    } catch (err) {
      throw new Error(`CRITICAL TEST SETUP ERROR: Failed to seed isolated test fixture '${u.id}': ${err.message}`);
    }
  }
});
