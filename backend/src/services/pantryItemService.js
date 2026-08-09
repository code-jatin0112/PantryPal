import prisma from "../config/database.js";
import AppError from "../utils/AppError.js";

const verifyPantryOwnership = async ({ userId, pantryId }) => {
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

  return pantry;
};

export const createPantryItem = async ({
  userId,
  pantryId,
  name,
  quantity,
  unit,
  expiryDate,
}) => {
  await verifyPantryOwnership({
    userId,
    pantryId,
  });

  return prisma.pantryItem.create({
    data: {
      pantryId,
      name: name.trim(),
      quantity,
      unit: unit.trim(),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
    },
  });
};

export const getPantryItems = async ({
  userId,
  pantryId,
}) => {
  await verifyPantryOwnership({
    userId,
    pantryId,
  });

  return prisma.pantryItem.findMany({
    where: {
      pantryId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getPantryItemById = async ({
  userId,
  pantryId,
  itemId,
}) => {
  await verifyPantryOwnership({
    userId,
    pantryId,
  });

  const item = await prisma.pantryItem.findFirst({
    where: {
      id: itemId,
      pantryId,
    },
  });

  if (!item) {
    throw new AppError(
      "Pantry item not found",
      404,
      "PANTRY_ITEM_NOT_FOUND"
    );
  }

  return item;
};

export const updatePantryItem = async ({
  userId,
  pantryId,
  itemId,
  name,
  quantity,
  unit,
  expiryDate,
}) => {
  await verifyPantryOwnership({
    userId,
    pantryId,
  });

  const item = await prisma.pantryItem.findFirst({
    where: {
      id: itemId,
      pantryId,
    },
  });

  if (!item) {
    throw new AppError(
      "Pantry item not found",
      404,
      "PANTRY_ITEM_NOT_FOUND"
    );
  }

  return prisma.pantryItem.update({
    where: {
      id: itemId,
    },
    data: {
      ...(name !== undefined && {
        name: name.trim(),
      }),

      ...(quantity !== undefined && {
        quantity,
      }),

      ...(unit !== undefined && {
        unit: unit.trim(),
      }),

      ...(expiryDate !== undefined && {
        expiryDate: expiryDate
          ? new Date(expiryDate)
          : null,
      }),
    },
  });
};

export const deletePantryItem = async ({
  userId,
  pantryId,
  itemId,
}) => {
  await verifyPantryOwnership({
    userId,
    pantryId,
  });

  const item = await prisma.pantryItem.findFirst({
    where: {
      id: itemId,
      pantryId,
    },
  });

  if (!item) {
    throw new AppError(
      "Pantry item not found",
      404,
      "PANTRY_ITEM_NOT_FOUND"
    );
  }

  await prisma.pantryItem.delete({
    where: {
      id: itemId,
    },
  });
};