import prisma from "../config/database.js";

export const searchAll = async ({
  userId,
  query = "",
  category = "",
  cuisine = "",
  maxTime,
  page = 1,
  limit = 20,
}) => {
  const skip = (page - 1) * limit;
  const sanitizedQuery = query.trim().toLowerCase();

  // Search recipes
  const recipeWhere = {
    ...(sanitizedQuery
      ? {
          OR: [
            { title: { contains: sanitizedQuery, mode: "insensitive" } },
            { description: { contains: sanitizedQuery, mode: "insensitive" } },
            {
              ingredients: {
                some: {
                  name: { contains: sanitizedQuery, mode: "insensitive" },
                },
              },
            },
          ],
        }
      : {}),
    ...(cuisine ? { cuisine: { equals: cuisine, mode: "insensitive" } } : {}),
    ...(maxTime ? { cookTime: { lte: parseInt(maxTime, 10) } } : {}),
  };

  // Search pantry items
  const pantryWhere = {
    pantry: { userId },
    ...(sanitizedQuery
      ? { name: { contains: sanitizedQuery, mode: "insensitive" } }
      : {}),
  };

  const [recipes, totalRecipes, pantryItems, totalPantryItems] =
    await Promise.all([
      prisma.recipe.findMany({
        where: recipeWhere,
        skip,
        take: limit,
        include: {
          ingredients: true,
          nutrition: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.recipe.count({ where: recipeWhere }),
      prisma.pantryItem.findMany({
        where: pantryWhere,
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.pantryItem.count({ where: pantryWhere }),
    ]);

  return {
    query: sanitizedQuery,
    recipes: {
      items: recipes,
      totalCount: totalRecipes,
      page,
      limit,
      totalPages: Math.ceil(totalRecipes / limit) || 1,
    },
    pantry: {
      items: pantryItems,
      totalCount: totalPantryItems,
      page,
      limit,
      totalPages: Math.ceil(totalPantryItems / limit) || 1,
    },
  };
};
