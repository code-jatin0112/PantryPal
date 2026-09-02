import React from 'react';
import { Search, Filter } from 'lucide-react';

const TABS = [
  { id: 'all',       label: 'All Notifications' },
  { id: 'unread',    label: 'Unread' },
  { id: 'important', label: 'Important' },
  { id: 'expiry',    label: 'Expiry Alerts' },
  { id: 'low_stock', label: 'Low Stock' },
  { id: 'meal_plan', label: 'Meal Plans' },
];

const NotificationFilters = ({
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  unreadCount = 0,
}) => {
  return (
    <div className="space-y-3">
      {/* ── Tabs Row ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[var(--color-dark)] text-white shadow-xs'
                  : 'bg-white border border-[rgba(138,144,112,0.18)] text-[var(--color-bark)] hover:bg-[var(--color-parchment)]'
              }`}
            >
              <span>{tab.label}</span>
              {tab.id === 'unread' && unreadCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive ? 'bg-white text-[var(--color-dark)]' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Search Bar ── */}
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-sage)] pointer-events-none"
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search notifications by title, ingredient, or message..."
          aria-label="Search notifications"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[rgba(138,144,112,0.20)] rounded-2xl text-xs sm:text-sm text-[var(--color-dark)] placeholder-[var(--color-sage)] focus:outline-none focus:border-[var(--color-sage)] focus:ring-2 focus:ring-[rgba(138,144,112,0.15)] transition-all shadow-xs"
        />
      </div>
    </div>
  );
};

export default NotificationFilters;
