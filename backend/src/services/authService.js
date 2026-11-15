import prisma from "../config/database.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateAccessToken } from "../utils/token.js";
import AppError from "../utils/AppError.js";

export const registerUser = async ({ name, email, password }) => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError(
      "User with this email already exists",
      409,
      "EMAIL_ALREADY_EXISTS"
    );
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  const accessToken = generateAccessToken(user.id);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    accessToken,
  };
};

export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.isActive) {
    throw new AppError(
      "Invalid email or password",
      401,
      "INVALID_CREDENTIALS"
    );
  }

  const passwordMatches = await comparePassword(password, user.password);

  if (!passwordMatches) {
    throw new AppError(
      "Invalid email or password",
      401,
      "INVALID_CREDENTIALS"
    );
  }

  const accessToken = generateAccessToken(user.id);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    accessToken,
  };
};

export const getCurrentUser = async ({ userId }) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user || !user.isActive) {
    throw new AppError(
      "User account is not available",
      401,
      "USER_NOT_AVAILABLE"
    );
  }

  return {
    user,
  };
};

export const updateUserProfile = async ({ userId, name, email }) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser || !existingUser.isActive) {
    throw new AppError(
      "User account is not available",
      401,
      "USER_NOT_AVAILABLE"
    );
  }

  const updateData = {};
  if (name !== undefined) {
    updateData.name = name ? name.trim() : null;
  }

  if (email !== undefined) {
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail !== existingUser.email.toLowerCase()) {
      const emailInUse = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (emailInUse && emailInUse.id !== userId) {
        throw new AppError(
          "User with this email already exists",
          409,
          "EMAIL_ALREADY_EXISTS"
        );
      }
      updateData.email = normalizedEmail;
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    user: updatedUser,
  };
};

export const changeUserPassword = async ({
  userId,
  currentPassword,
  newPassword,
}) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.isActive) {
    throw new AppError(
      "User account is not available",
      401,
      "USER_NOT_AVAILABLE"
    );
  }

  const passwordMatches = await comparePassword(currentPassword, user.password);
  if (!passwordMatches) {
    throw new AppError(
      "Current password is incorrect",
      400,
      "INVALID_CURRENT_PASSWORD"
    );
  }

  if (currentPassword === newPassword) {
    throw new AppError(
      "New password must be different from current password",
      400,
      "PASSWORD_UNCHANGED"
    );
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return {
    message: "Password changed successfully",
  };
};

export const deleteUserAccount = async ({ userId, password }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.isActive) {
    throw new AppError(
      "User account is not available",
      401,
      "USER_NOT_AVAILABLE"
    );
  }

  const passwordMatches = await comparePassword(password, user.password);
  if (!passwordMatches) {
    throw new AppError(
      "Incorrect password. Verification failed.",
      400,
      "INVALID_PASSWORD"
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.delete({
      where: { id: userId },
    });
  });

  try {
    const { AiInteractionLog } = await import("../models/AiInteractionLog.js");
    if (AiInteractionLog) {
      await AiInteractionLog.deleteMany({ userId });
    }
  } catch (mongoErr) {
    // Non-blocking if mongo is not active
  }

  return {
    message: "Account and associated data deleted successfully",
  };
};

export const exportUserData = async ({ userId }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user || !user.isActive) {
    throw new AppError(
      "User account is not available",
      401,
      "USER_NOT_AVAILABLE"
    );
  }

  const [
    preferences,
    pantries,
    recipes,
    shoppingItems,
    mealPlans,
    favorites,
    cookingSessions,
  ] = await Promise.all([
    prisma.userPreference.findUnique({ where: { userId } }),
    prisma.pantry.findMany({
      where: { userId },
      include: {
        items: true,
      },
    }),
    prisma.recipe.findMany({
      where: { userId },
      include: {
        ingredients: true,
        nutrition: true,
      },
    }),
    prisma.shoppingListItem.findMany({
      where: { userId },
    }),
    prisma.mealPlan.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            recipe: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    }),
    prisma.recipeFavorite.findMany({
      where: { userId },
      include: {
        recipe: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
    prisma.cookingSession.findMany({
      where: { userId },
      include: {
        recipe: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    version: "1.0.0",
    account: user,
    preferences: preferences
      ? {
          ...preferences,
          dietaryRequirements: preferences.dietaryPreferences,
        }
      : null,
    pantries,
    recipes,
    shoppingList: shoppingItems,
    mealPlans,
    favorites,
    cookingSessions,
  };
};
