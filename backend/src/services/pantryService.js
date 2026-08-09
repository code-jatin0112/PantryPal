import prisma from "../config/database.js";
import AppError from "../utils/AppError.js";

export const createPantry = async ({ userId, name }) => {
  const pantry = await prisma.pantry.create({
    data: {
      userId,
      name: name?.trim() || "My Pantry",
    },
  });

  return pantry;
};

export const getUserPantries = async (userId) => {
  return prisma.pantry.findMany({
    where: {
      userId,
    },
    include: {
      _count: {
        select: {
          items: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getPantryById = async ({ userId, pantryId }) => {
  const pantry = await prisma.pantry.findFirst({
    where: {
      id: pantryId,
      userId,
    },
    include: {
      items: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!pantry) {
    throw new AppError(
      "Pantry not found",
      404,
      "PANTRY_NOT_FOUND"
    );
  }

  return pantry;
};

export const updatePantry = async ({ userId, pantryId, name }) => {
  const pantry = await prisma.pantry.findFirst({
    where: {
      id: pantryId,
      userId,
    },
  });

  if (!pantry) {
    throw new AppError(
      "Pantry not found",
      404,
      "PANTRY_NOT_FOUND"
    );
  }

  return prisma.pantry.update({
    where: {
      id: pantryId,
    },
    data: {
      name: name.trim(),
    },
  });
};

export const deletePantry = async ({ userId, pantryId }) => {
  const pantry = await prisma.pantry.findFirst({
    where: {
      id: pantryId,
      userId,
    },
  });

  if (!pantry) {
    throw new AppError(
      "Pantry not found",
      404,
      "PANTRY_NOT_FOUND"
    );
  }

  await prisma.pantry.delete({
    where: {
      id: pantryId,
    },
  });
};