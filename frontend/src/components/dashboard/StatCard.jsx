import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({
  icon: Icon,
  title,
  value,
  description,
  trend,
  onClick,
}) => {
  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-5 shadow-[0_1px_3px_rgba(39,42,31,0.04)] hover:shadow-elevated transition-all flex flex-col justify-between ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-semibold text-[var(--color-sage)] uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-[rgba(138,144,112,0.10)] text-[var(--color-sage)] flex items-center justify-center flex-shrink-0">
            <Icon size={18} />
          </div>
        )}
      </div>

      <div>
        <p className="text-3xl font-extrabold text-[var(--color-dark)] leading-tight tracking-tight tabular-nums">
          {value}
        </p>
        {description && (
          <p className="text-xs text-[var(--color-sage)] mt-1 font-medium">
            {description}
          </p>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-[rgba(138,144,112,0.10)] flex items-center gap-1.5 text-xs">
          <span className={`font-semibold ${trend.positive ? 'text-emerald-600' : 'text-amber-600'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
          <span className="text-[var(--color-sage)] opacity-80">{trend.label}</span>
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
