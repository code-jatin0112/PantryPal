import prisma from "../config/database.js";

export const createShoppingListItem = async ({
  userId,
  recipeId,
  name,
  quantity,
  unit,
}) => {
  if (recipeId) {
    const recipe = await prisma.recipe.findFirst({
      where: {
        id: recipeId,
        userId,
      },
    });

    if (!recipe) {
      return null;
    }
  }

  return prisma.shoppingListItem.create({
    data: {
      userId,
      recipeId: recipeId ?? null,
      name,
      quantity,
      unit,
    },
  });
};

export const getShoppingListItems = async ({
  userId,
  isPurchased,
}) => {
  return prisma.shoppingListItem.findMany({
    where: {
      userId,
      ...(isPurchased !== undefined && {
        isPurchased,
      }),
    },
    orderBy: {
      createdAt: "asc",
    },
  });
};

export const getShoppingListItemById = async ({
  userId,
  itemId,
}) => {
  return prisma.shoppingListItem.findFirst({
    where: {
      id: itemId,
      userId,
    },
  });
};

export const updateShoppingListItem = async ({
  userId,
  itemId,
  name,
  quantity,
  unit,
  isPurchased,
}) => {
  const item = await prisma.shoppingListItem.findFirst({
    where: {
      id: itemId,
      userId,
    },
  });

  if (!item) {
    return null;
  }

  return prisma.shoppingListItem.update({
    where: {
      id: itemId,
    },
    data: {
      ...(name !== undefined && { name }),
      ...(quantity !== undefined && { quantity }),
      ...(unit !== undefined && { unit }),
      ...(isPurchased !== undefined && { isPurchased }),
    },
  });
};

export const deleteShoppingListItem = async ({
  userId,
  itemId,
}) => {
  const item = await prisma.shoppingListItem.findFirst({
    where: {
      id: itemId,
      userId,
    },
  });

  if (!item) {
    return null;
  }

  await prisma.shoppingListItem.delete({
    where: {
      id: itemId,
    },
  });

  return true;
};

export const clearPurchasedShoppingListItems = async ({
  userId,
}) => {
  const result = await prisma.shoppingListItem.deleteMany({
    where: {
      userId,
      isPurchased: true,
    },
  });

  return result.count;
};