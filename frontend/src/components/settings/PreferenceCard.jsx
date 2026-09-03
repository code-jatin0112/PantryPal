import React from 'react';
import { Check } from 'lucide-react';

const PreferenceCard = ({
  icon: Icon,
  title,
  description,
  isSelected = false,
  onClick,
  badge,
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none relative text-left flex flex-col justify-between gap-2 ${
        isSelected
          ? 'bg-[var(--color-dark)] text-white border-[var(--color-dark)] shadow-sm'
          : 'bg-white border-[rgba(138,144,112,0.18)] hover:border-[var(--color-sage)] hover:bg-[var(--color-parchment)]/50'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isSelected
                  ? 'bg-white/20 text-white'
                  : 'bg-[rgba(138,144,112,0.12)] text-[var(--color-sage)]'
              }`}
            >
              <Icon size={14} />
            </div>
          )}
          <h4
            className={`text-xs font-bold ${
              isSelected ? 'text-white' : 'text-[var(--color-dark)]'
            }`}
          >
            {title}
          </h4>
        </div>

        {isSelected && (
          <div className="w-5 h-5 rounded-full bg-white text-[var(--color-dark)] flex items-center justify-center shadow-xs">
            <Check size={11} strokeWidth={3} />
          </div>
        )}
      </div>

      {description && (
        <p
          className={`text-[11px] leading-relaxed font-medium ${
            isSelected ? 'text-white/80' : 'text-[var(--color-sage)]'
          }`}
        >
          {description}
        </p>
      )}

      {badge && (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-md self-start ${
            isSelected
              ? 'bg-white/20 text-white'
              : 'bg-[var(--color-parchment)] text-[var(--color-bark)]'
          }`}
        >
          {badge}
        </span>
      )}
    </div>
  );
};

export default PreferenceCard;
