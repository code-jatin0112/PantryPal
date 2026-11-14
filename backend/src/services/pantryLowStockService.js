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

export const getLowStockPantryItems = async ({
  userId,
  pantryId,
  threshold = 5,
}) => {
  await verifyPantryOwnership({
    userId,
    pantryId,
  });

  const items = await prisma.pantryItem.findMany({
    where: {
      pantryId,
    },
    orderBy: [
      {
        quantity: "asc",
      },
      {
        name: "asc",
      },
    ],
  });

  return items.filter((item) => {
    const itemThreshold =
      item.minimumQuantity !== null && item.minimumQuantity !== undefined
        ? item.minimumQuantity
        : threshold;
    return item.quantity <= itemThreshold;
  });
};