import { beforeAll } from "vitest";
import prisma from "../src/config/database.js";

beforeAll(async () => {
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
    } catch {
      // Ignore if database is not reachable during isolated unit test setup
    }
  }
});
