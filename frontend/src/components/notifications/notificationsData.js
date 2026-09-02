export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    category: 'expiry',
    title: 'Whole Milk Expiring Soon',
    description: '1 container of Whole Milk (Organic Valley) is expiring in 2 days. Use it in a soup or smoothie to prevent food waste.',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 mins ago
    isRead: false,
    priority: 'high',
    actionText: 'View in Pantry',
    actionLink: '/pantry',
  },
  {
    id: 'notif-2',
    category: 'meal_plan',
    title: 'Dinner Scheduled Tonight: Tuscan Chicken',
    description: 'Scheduled for 7:30 PM (serves 3). All 4 key ingredients are available in your kitchen stock.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    isRead: false,
    priority: 'medium',
    actionText: 'Start Cooking Mode',
    actionLink: '/cooking/demo',
  },
  {
    id: 'notif-3',
    category: 'low_stock',
    title: 'Extra Virgin Olive Oil Running Low',
    description: 'Stock level is at 100ml (below minimum threshold of 250ml). Would you like to add it to your shopping list?',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    isRead: false,
    priority: 'high',
    actionText: 'Add to Shopping List',
    actionLink: '/shopping-list',
  },
  {
    id: 'notif-4',
    category: 'ai_recommendation',
    title: 'New AI Recipe Match: Tuscan Salmon (96%)',
    description: 'Gemini AI generated a 15-minute Mediterranean salmon dinner that utilizes your fresh baby spinach and garlic.',
    timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(), // 14 hours ago
    isRead: true,
    priority: 'medium',
    actionText: 'View Recommendation',
    actionLink: '/ai-recommendations',
  },
  {
    id: 'notif-5',
    category: 'cooking',
    title: 'Kitchen Timer Completed',
    description: 'Your 10-minute simmering timer for tomato curry base has ended.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    isRead: true,
    priority: 'low',
    actionText: 'Open Cooking Mode',
    actionLink: '/cooking/demo',
  },
  {
    id: 'notif-6',
    category: 'shopping',
    title: '6 Grocery Items Restocked',
    description: 'Items purchased from weekend grocery run have been synced directly to your active pantry container.',
    timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), // 1.5 days ago
    isRead: true,
    priority: 'low',
    actionText: 'View Shopping List',
    actionLink: '/shopping-list',
  },
  {
    id: 'notif-7',
    category: 'account',
    title: 'Weekly Waste Reduction Report',
    description: 'Congratulations! You prevented 84% of potential kitchen food waste this week and saved an estimated $32.40.',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
    isRead: true,
    priority: 'low',
    actionText: 'View Dashboard',
    actionLink: '/',
  },
];
