import React from 'react';

const ToggleSwitch = ({
  checked = false,
  onChange,
  disabled = false,
  label,
  description,
  id,
}) => {
  const toggleId = id || `toggle-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      {(label || description) && (
        <label htmlFor={toggleId} className="cursor-pointer select-none flex-1 text-left">
          {label && (
            <span className="block text-xs sm:text-sm font-bold text-[var(--color-dark)] leading-tight">
              {label}
            </span>
          )}
          {description && (
            <span className="block text-[11px] text-[var(--color-sage)] font-semibold mt-0.5">
              {description}
            </span>
          )}
        </label>
      )}

      <button
        type="button"
        id={toggleId}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] focus:ring-offset-2 ${
          checked ? 'bg-[var(--color-dark)]' : 'bg-[rgba(138,144,112,0.25)]'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

export default ToggleSwitch;
