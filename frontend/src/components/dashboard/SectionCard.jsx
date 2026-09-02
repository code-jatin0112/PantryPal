import React from 'react';

const SectionCard = ({
  icon: Icon,
  title,
  subtitle,
  action,
  children,
  className = '',
  bodyClassName = '',
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-5 sm:p-6 shadow-[0_1px_3px_rgba(39,42,31,0.04)] flex flex-col ${className}`}
    >
      {/* Card Header */}
      {(title || Icon || action) && (
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[rgba(138,144,112,0.10)]">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <div className="w-8 h-8 rounded-xl bg-[rgba(138,144,112,0.10)] text-[var(--color-sage)] flex items-center justify-center flex-shrink-0">
                <Icon size={16} />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[var(--color-dark)] truncate leading-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-[var(--color-sage)] mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}

      {/* Card Body */}
      <div className={`flex-1 ${bodyClassName}`}>{children}</div>
    </div>
  );
};

export default SectionCard;
