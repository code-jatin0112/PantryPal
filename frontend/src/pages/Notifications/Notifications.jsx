import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';

import NotificationHeader from '../../components/notifications/NotificationHeader';
import NotificationFilters from '../../components/notifications/NotificationFilters';
import NotificationList from '../../components/notifications/NotificationList';
import NotificationEmptyState from '../../components/notifications/NotificationEmptyState';
import NotificationSkeleton from '../../components/notifications/NotificationSkeleton';
import { getNotifications, saveNotifications } from '../../services/notificationService';
import { usePantry } from '../../hooks/usePantry';
import Button from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';

const PAGE_SIZE = 8;

const Notifications = () => {
  const toast = useToast();
  const { activePantry } = usePantry();

  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);

  // Load from notification service (aggregating backend expiry & low stock alerts)
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotifications(activePantry?.id);
      setNotifications(data);
    } finally {
      setLoading(false);
    }
  }, [activePantry?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Persist local read state
  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  // Unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Tab filter
      if (activeTab === 'unread' && n.isRead) return false;
      if (activeTab === 'important' && n.priority !== 'high') return false;
      if (activeTab === 'expiry' && n.category !== 'expiry') return false;
      if (activeTab === 'low_stock' && n.category !== 'low_stock') return false;
      if (activeTab === 'meal_plan' && n.category !== 'meal_plan') return false;

      // Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchTitle = (n.title || '').toLowerCase().includes(q);
        const matchDesc = (n.description || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }

      return true;
    });
  }, [notifications, activeTab, searchTerm]);

  // Sliced for pagination / infinite scroll
  const displayedNotifications = filteredNotifications.slice(0, visibleCount);
  const hasMore = visibleCount < filteredNotifications.length;

  // Toggle Read
  const handleToggleRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  // Delete notification
  const handleDelete = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast('Notification removed.', 'info');
  };

  // Mark all read
  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast('All notifications marked as read! ✨', 'success');
  };

  // Clear all
  const handleClearAll = () => {
    setNotifications([]);
    toast('Notifications inbox cleared.', 'info');
  };

  const handleResetFilters = () => {
    setActiveTab('all');
    setSearchTerm('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 max-w-4xl mx-auto text-left"
    >
      {/* ── Header ── */}
      <NotificationHeader
        unreadCount={unreadCount}
        totalCount={notifications.length}
        onMarkAllRead={handleMarkAllRead}
        onClearAll={handleClearAll}
      />

      {/* ── Filters & Search ── */}
      <NotificationFilters
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        unreadCount={unreadCount}
      />

      {/* ── Notifications List / Empty / Skeleton ── */}
      {loading ? (
        <NotificationSkeleton />
      ) : displayedNotifications.length === 0 ? (
        <NotificationEmptyState
          isFiltered={activeTab !== 'all' || Boolean(searchTerm.trim())}
          onResetFilters={handleResetFilters}
        />
      ) : (
        <div className="space-y-4">
          <NotificationList
            notifications={displayedNotifications}
            onToggleRead={handleToggleRead}
            onDelete={handleDelete}
          />

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="text-xs font-bold"
              >
                Load Older Notifications ({filteredNotifications.length - visibleCount} remaining)
              </Button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default Notifications;
