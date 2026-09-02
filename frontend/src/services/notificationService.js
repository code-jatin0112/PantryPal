import api from './api';
import { PANTRY, MEAL_PLANS } from '../constants/api';
import { INITIAL_NOTIFICATIONS } from '../components/notifications/notificationsData';

const STORAGE_NOTIFICATIONS_KEY = 'pantrypal_notifications';

/**
 * Fetch and aggregate live notifications from backend pantry & meal planning alerts
 */
export const getNotifications = async (pantryId) => {
  const localNotifications = (() => {
    try {
      const saved = localStorage.getItem(STORAGE_NOTIFICATIONS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  })();

  if (!pantryId) return localNotifications;

  try {
    const [expiringRes, lowStockRes] = await Promise.allSettled([
      api.get(PANTRY.EXPIRING(pantryId, 5)),
      api.get(PANTRY.LOW_STOCK(pantryId)),
    ]);

    const liveNotifications = [...localNotifications];

    // Map backend expiring items to live notifications
    if (expiringRes.status === 'fulfilled') {
      const expiringItems = expiringRes.value.data?.data?.items || expiringRes.value.data?.data || [];
      expiringItems.forEach((item) => {
        const id = `notif-exp-${item.id}`;
        if (!liveNotifications.some((n) => n.id === id)) {
          liveNotifications.unshift({
            id,
            category: 'expiry',
            title: `${item.name} Expiring Soon`,
            description: `You have ${item.quantity} ${item.unit || ''} nearing expiration date. Consider using it in your next meal.`,
            timestamp: new Date().toISOString(),
            isRead: false,
            priority: 'high',
            actionText: 'View in Pantry',
            actionLink: '/pantry',
          });
        }
      });
    }

    // Map backend low stock items
    if (lowStockRes.status === 'fulfilled') {
      const lowStockItems = lowStockRes.value.data?.data?.items || lowStockRes.value.data?.data || [];
      lowStockItems.forEach((item) => {
        const id = `notif-low-${item.id}`;
        if (!liveNotifications.some((n) => n.id === id)) {
          liveNotifications.unshift({
            id,
            category: 'low_stock',
            title: `${item.name} Stock is Low`,
            description: `Remaining quantity is ${item.quantity} ${item.unit || ''}. Add to shopping list to restock.`,
            timestamp: new Date().toISOString(),
            isRead: false,
            priority: 'high',
            actionText: 'Add to Shopping List',
            actionLink: '/shopping-list',
          });
        }
      });
    }

    return liveNotifications;
  } catch (err) {
    console.warn('Backend notification aggregation fallback.', err);
    return localNotifications;
  }
};

/**
 * Save notification state to local persistence
 */
export const saveNotifications = (notifications) => {
  try {
    localStorage.setItem(STORAGE_NOTIFICATIONS_KEY, JSON.stringify(notifications));
  } catch {}
};
