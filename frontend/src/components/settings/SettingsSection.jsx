import React from 'react';
import { motion } from 'framer-motion';

const SettingsSection = ({
  icon: Icon,
  title,
  description,
  children,
  action,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-5 sm:p-6 shadow-[0_1px_3px_rgba(39,42,31,0.04)] space-y-4 text-left ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(138,144,112,0.10)]">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-9 h-9 rounded-xl bg-[rgba(138,144,112,0.12)] text-[var(--color-sage)] flex items-center justify-center flex-shrink-0 shadow-xs">
              <Icon size={18} />
            </div>
          )}
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-[var(--color-dark)] leading-snug">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-[var(--color-sage)] font-semibold mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>

        {action && <div className="self-start sm:self-auto">{action}</div>}
      </div>

      {/* Content */}
      <div className="space-y-3">{children}</div>
    </motion.div>
  );
};

export default SettingsSection;
