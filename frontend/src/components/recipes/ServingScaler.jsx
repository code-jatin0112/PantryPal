import React from 'react';
import { Users, Minus, Plus } from 'lucide-react';

const PRESET_SERVINGS = [2, 4, 6, 8, 10];

const ServingScaler = ({ servings = 2, onChange, disabled = false }) => {
  const handleDecrement = () => {
    if (servings > 1 && !disabled) {
      onChange(servings - 1);
    }
  };

  const handleIncrement = () => {
    if (servings < 20 && !disabled) {
      onChange(servings + 1);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-4 shadow-[0_1px_3px_rgba(39,42,31,0.04)] flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[rgba(138,144,112,0.10)] text-[var(--color-sage)] flex items-center justify-center flex-shrink-0">
          <Users size={16} />
        </div>
        <div>
          <span className="text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider block">
            Servings
          </span>
          <span className="text-[11px] text-[var(--color-sage)]">
            Scales ingredient measurements dynamically
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Preset quick buttons */}
        <div className="hidden sm:flex items-center gap-1 bg-[var(--color-parchment)] p-1 rounded-xl">
          {PRESET_SERVINGS.map((preset) => {
            const isActive = Number(servings) === preset;
            return (
              <button
                key={preset}
                type="button"
                disabled={disabled}
                onClick={() => onChange(preset)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[var(--color-sage)] text-white shadow-sm'
                    : 'text-[var(--color-bark)] hover:bg-white'
                }`}
              >
                {preset}
              </button>
            );
          })}
        </div>

        {/* Stepper controls */}
        <div className="flex items-center gap-1 bg-[var(--color-parchment)] p-1 rounded-xl">
          <button
            type="button"
            disabled={disabled || servings <= 1}
            onClick={handleDecrement}
            aria-label="Decrease servings"
            className="w-7 h-7 rounded-lg bg-white text-[var(--color-dark)] flex items-center justify-center hover:bg-[var(--color-sage)] hover:text-white transition-colors disabled:opacity-40 shadow-sm"
          >
            <Minus size={13} />
          </button>
          <span className="w-8 text-center text-sm font-extrabold text-[var(--color-dark)] tabular-nums">
            {servings}
          </span>
          <button
            type="button"
            disabled={disabled || servings >= 20}
            onClick={handleIncrement}
            aria-label="Increase servings"
            className="w-7 h-7 rounded-lg bg-white text-[var(--color-dark)] flex items-center justify-center hover:bg-[var(--color-sage)] hover:text-white transition-colors disabled:opacity-40 shadow-sm"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServingScaler;
