import React from 'react';

/**
 * Select — styled native select element
 *
 * Props:
 *  label:      string
 *  error:      string
 *  hint:       string
 *  options:    Array<{ value: string, label: string } | string>
 *  placeholder: string
 */
const Select = React.forwardRef(({
  label,
  error,
  hint,
  options = [],
  placeholder,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `select-${label?.toLowerCase().replace(/\s+/g, '-') || Math.random()}`;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-[var(--color-dark)]">
          {label}
        </label>
      )}

      <select
        ref={ref}
        id={inputId}
        className={`input py-2.5 px-4 text-sm appearance-none bg-white cursor-pointer ${error ? 'input-error' : ''}`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238A9070' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 14px center',
          paddingRight: '36px',
        }}
        aria-invalid={!!error}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => {
          const val = typeof opt === 'string' ? opt : opt.value;
          const lbl = typeof opt === 'string' ? opt : opt.label;
          return <option key={val} value={val}>{lbl}</option>;
        })}
      </select>

      {error && (
        <p role="alert" className="text-xs text-[var(--color-danger)]">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-[var(--color-sage)]">{hint}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
