import React from 'react';

/**
 * Input — PantryPal form input component
 *
 * Props:
 *  label:      string
 *  error:      string (validation error message)
 *  hint:       string (helper text below input)
 *  icon:       Lucide icon (left side)
 *  iconRight:  Lucide icon (right side, e.g. password toggle)
 *  inputSize:  'sm' | 'md' | 'lg'
 */
const Input = React.forwardRef(({
  label,
  error,
  hint,
  icon: Icon,
  iconRight: IconRight,
  onIconRightClick,
  inputSize = 'md',
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-') || Math.random()}`;

  const sizeStyles = {
    sm: 'py-2 px-3 text-xs',
    md: 'py-2.5 px-4 text-sm',
    lg: 'py-3.5 px-5 text-base',
  }[inputSize];

  const iconPadLeft = Icon ? (inputSize === 'sm' ? 'pl-8' : 'pl-10') : '';
  const iconPadRight = IconRight ? (inputSize === 'sm' ? 'pr-8' : 'pr-10') : '';

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-semibold text-[var(--color-dark)]"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-sage)] pointer-events-none`}>
            <Icon size={inputSize === 'sm' ? 14 : 16} />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          className={`input ${sizeStyles} ${iconPadLeft} ${iconPadRight} ${error ? 'input-error' : ''}`}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          aria-invalid={!!error}
          {...props}
        />

        {IconRight && (
          <button
            type="button"
            onClick={onIconRightClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-sage)] hover:text-[var(--color-bark)] transition-colors"
            tabIndex={-1}
          >
            <IconRight size={inputSize === 'sm' ? 14 : 16} />
          </button>
        )}
      </div>

      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-[var(--color-danger)] flex items-center gap-1">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-[var(--color-sage)]">
          {hint}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
