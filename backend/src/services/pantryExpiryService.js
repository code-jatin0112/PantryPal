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

const startOfToday = () => {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return today;
};

const endOfDay = (date) => {
  const end = new Date(date);

  end.setHours(23, 59, 59, 999);

  return end;
};

const getDaysUntilExpiry = (expiryDate) => {
  const today = startOfToday();

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.ceil(
    (expiry.getTime() - today.getTime()) /
      millisecondsPerDay
  );
};

const enrichItemsWithExpiryStatus = (items) => {
  return items.map((item) => ({
    ...item,
    daysUntilExpiry: getDaysUntilExpiry(item.expiryDate),
  }));
};

export const getExpiringPantryItems = async ({
  userId,
  pantryId,
  days = 7,
}) => {
  await verifyPantryOwnership({
    userId,
    pantryId,
  });

  const today = startOfToday();

  const expiryLimit = new Date(today);
  expiryLimit.setDate(expiryLimit.getDate() + days);

  const items = await prisma.pantryItem.findMany({
    where: {
      pantryId,
      expiryDate: {
        gte: today,
        lte: endOfDay(expiryLimit),
      },
    },
    orderBy: {
      expiryDate: "asc",
    },
  });

  return enrichItemsWithExpiryStatus(items);
};

export const getExpiredPantryItems = async ({
  userId,
  pantryId,
}) => {
  await verifyPantryOwnership({
    userId,
    pantryId,
  });

  const today = startOfToday();

  const items = await prisma.pantryItem.findMany({
    where: {
      pantryId,
      expiryDate: {
        lt: today,
      },
    },
    orderBy: {
      expiryDate: "asc",
    },
  });

  return enrichItemsWithExpiryStatus(items);
};