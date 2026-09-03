import React from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import Button from '../ui/Button';

const NotificationEmptyState = ({ isFiltered = false, onResetFilters }) => {
  return (
    <div className="bg-white rounded-3xl border border-[rgba(138,144,112,0.18)] p-8 sm:p-12 text-center flex flex-col items-center justify-center shadow-[0_1px_3px_rgba(39,42,31,0.04)] space-y-3 max-w-md mx-auto">
      <div className="w-16 h-16 rounded-3xl bg-[rgba(138,144,112,0.10)] text-[var(--color-sage)] flex items-center justify-center shadow-xs">
        {isFiltered ? <Bell size={28} /> : <CheckCircle2 size={28} className="text-emerald-600" />}
      </div>

      <div className="space-y-1">
        <h3 className="text-base sm:text-lg font-extrabold text-[var(--color-dark)]">
          {isFiltered ? 'No matching notifications' : "You're all caught up! 🎉"}
        </h3>
        <p className="text-xs text-[var(--color-sage)] font-medium leading-relaxed">
          {isFiltered
            ? 'No alerts match your current tab or search query.'
            : 'No active expiry warnings, low stock alerts, or cooking reminders at this time.'}
        </p>
      </div>

      {isFiltered && onResetFilters && (
        <div className="pt-2">
          <Button variant="secondary" size="sm" onClick={onResetFilters} className="text-xs font-bold">
            Show All Notifications
          </Button>
        </div>
      )}
    </div>
  );
};

export default NotificationEmptyState;
