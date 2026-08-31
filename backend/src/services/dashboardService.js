import prisma from "../config/database.js";

export const getDashboardMetrics = async (userId) => {
  const now = new Date();
  const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  // Parallel data fetching for performance
  const [
    pantries,
    savedRecipesCount,
    mealPlansCount,
    shoppingItems,
    cookingSessions,
  ] = await Promise.all([
    prisma.pantry.findMany({
      where: { userId },
      include: { items: true },
    }),
    prisma.recipeFavorite.count({
      where: { userId },
    }),
    prisma.mealPlan.count({
      where: { userId },
    }),
    prisma.shoppingListItem.findMany({
      where: { userId },
    }),
    prisma.cookingSession.findMany({
      where: { userId },
      take: 50,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Aggregate pantry statistics
  const allItems = pantries.flatMap((p) => p.items || []);
  const totalPantryItems = allItems.length;

  let expiringSoonCount = 0;
  let expiredCount = 0;
  let lowStockCount = 0;

  for (const item of allItems) {
    if (item.expiryDate) {
      const expDate = new Date(item.expiryDate);
      if (expDate < now) {
        expiredCount++;
      } else if (expDate <= threeDaysFromNow) {
        expiringSoonCount++;
      }
    }
    if (item.quantity <= 1) {
      lowStockCount++;
    }
  }

  // Calculate shopping statistics
  const unpurchasedShoppingItems = shoppingItems.filter((i) => !i.isPurchased);
  const estimatedShoppingTotal = unpurchasedShoppingItems.reduce(
    (sum, item) => sum + (item.quantity * 2.5), // Normalized estimated unit cost
    0
  );

  // Calculate waste reduced & usage stats
  const completedSessions = cookingSessions.filter(
    (s) => s.status === "completed"
  );
  const wasteReducedKg = Math.round(completedSessions.length * 0.45 * 10) / 10;
  const weeklyUsageCount = completedSessions.filter((s) => {
    const sessionDate = new Date(s.completedAt || s.createdAt);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return sessionDate >= oneWeekAgo;
  }).length;

  const monthlyUsageCount = completedSessions.filter((s) => {
    const sessionDate = new Date(s.completedAt || s.createdAt);
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return sessionDate >= oneMonthAgo;
  }).length;

  return {
    overview: {
      totalPantryItems,
      expiringSoon: expiringSoonCount,
      expired: expiredCount,
      lowStockItems: lowStockCount,
      savedRecipes: savedRecipesCount,
      activeMealPlans: mealPlansCount,
      shoppingItemsCount: unpurchasedShoppingItems.length,
      estimatedShoppingBudget: Math.round(estimatedShoppingTotal * 100) / 100,
      wasteReducedKg,
      weeklyUsage: weeklyUsageCount,
      monthlyUsage: monthlyUsageCount,
    },
    expiringItems: allItems
      .filter((i) => i.expiryDate && new Date(i.expiryDate) <= threeDaysFromNow)
      .slice(0, 5),
    recentSessions: completedSessions.slice(0, 5),
  };
};
