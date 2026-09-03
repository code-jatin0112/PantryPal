import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

const ShoppingStats = ({
  totalItems = 0,
  purchasedCount = 0,
  remainingCount = 0,
  highPriorityCount = 0,
  onSelectFilter,
}) => {
  const stats = [
    {
      label: 'Total Items',
      value: totalItems,
      icon: ShoppingCart,
      filter: 'ALL',
      description: 'Items on your grocery list',
      badgeColor: 'text-[var(--color-sage)] bg-[rgba(138,144,112,0.10)]',
    },
    {
      label: 'Purchased',
      value: purchasedCount,
      icon: CheckCircle2,
      filter: 'PURCHASED',
      description: 'Marked as bought',
      badgeColor: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Remaining',
      value: remainingCount,
      icon: Clock,
      filter: 'PENDING',
      description: 'Still needed in kitchen',
      badgeColor: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'High Priority',
      value: highPriorityCount,
      icon: AlertTriangle,
      filter: 'HIGH_PRIORITY',
      description: 'Urgent restock items',
      badgeColor: 'text-[var(--color-danger)] bg-[var(--color-danger-bg)]',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <motion.div
            key={stat.label}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            onClick={() => onSelectFilter?.(stat.filter)}
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

export default ShoppingStats;
