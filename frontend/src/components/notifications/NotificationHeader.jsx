import React from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import Button from '../ui/Button';

const NotificationHeader = ({
  unreadCount = 0,
  totalCount = 0,
  onMarkAllRead,
  onClearAll,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[rgba(138,144,112,0.12)] text-[var(--color-sage)] flex items-center justify-center">
            <Bell size={16} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-dark)] tracking-tight">
            Notifications Center
          </h1>
          {unreadCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {unreadCount} Unread
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-[var(--color-sage)] font-semibold mt-1">
          Stay on top of expiring ingredients, planned dinners, shopping reminders, and AI tips
        </p>
      </div>

      {totalCount > 0 && (
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              icon={CheckCheck}
              onClick={onMarkAllRead}
              className="text-xs font-bold"
            >
              Mark All Read
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            icon={Trash2}
            onClick={onClearAll}
            className="text-xs font-bold text-red-600 hover:bg-red-50 hover:border-red-200"
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
};

export default NotificationHeader;
