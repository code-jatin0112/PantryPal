import React from 'react';
import { motion } from 'framer-motion';
import { Package, CalendarClock, AlertOctagon, TrendingDown } from 'lucide-react';

const PantryStats = ({
  totalItems = 0,
  expiringCount = 0,
  expiredCount = 0,
  lowStockCount = 0,
  onSelectFilter,
}) => {
  const stats = [
    {
      label: 'Total Items',
      value: totalItems,
      icon: Package,
      status: 'ALL',
      description: 'Active items in pantry',
      badgeColor: 'text-[var(--color-sage)] bg-[rgba(138,144,112,0.10)]',
    },
    {
      label: 'Expiring Soon',
      value: expiringCount,
      icon: CalendarClock,
      status: 'EXPIRING_SOON',
      description: 'Expires within 7 days',
      badgeColor: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Expired',
      value: expiredCount,
      icon: AlertOctagon,
      status: 'EXPIRED',
      description: 'Immediate disposal needed',
      badgeColor: 'text-[var(--color-danger)] bg-[var(--color-danger-bg)]',
    },
    {
      label: 'Low Stock',
      value: lowStockCount,
      icon: TrendingDown,
      status: 'LOW_STOCK',
      description: 'Below safe threshold',
      badgeColor: 'text-orange-600 bg-orange-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;

        return (
          <motion.div
            key={stat.label}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            onClick={() => onSelectFilter?.(stat.status)}
            className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-4 sm:p-5 shadow-[0_1px_3px_rgba(39,42,31,0.04)] hover:shadow-elevated transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-[var(--color-sage)] uppercase tracking-wider truncate">
                {stat.label}
              </span>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.badgeColor}`}
              >
                <Icon size={16} />
              </div>
            </div>

            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-[var(--color-dark)] tabular-nums leading-tight">
                {stat.value}
              </p>
              <p className="text-[11px] text-[var(--color-sage)] mt-0.5 font-medium truncate">
                {stat.description}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default PantryStats;
