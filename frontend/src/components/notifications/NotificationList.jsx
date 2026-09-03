import React from 'react';
import { AnimatePresence } from 'framer-motion';
import NotificationCard from './NotificationCard';

const NotificationList = ({
  notifications = [],
  onToggleRead,
  onDelete,
}) => {
  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {notifications.map((notif) => (
          <NotificationCard
            key={notif.id}
            notification={notif}
            onToggleRead={onToggleRead}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationList;
