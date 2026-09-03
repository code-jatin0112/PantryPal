import React from 'react';

/**
 * Textarea — styled multiline input
 */
const Textarea = React.forwardRef(({
  label,
  error,
  hint,
  rows = 4,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `textarea-${label?.toLowerCase().replace(/\s+/g, '-') || Math.random()}`;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-[var(--color-dark)]">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={`input py-3 px-4 text-sm resize-y min-h-[80px] ${error ? 'input-error' : ''}`}
        aria-invalid={!!error}
        {...props}
      />
      {error && <p role="alert" className="text-xs text-[var(--color-danger)]">{error}</p>}
      {hint && !error && <p className="text-xs text-[var(--color-sage)]">{hint}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
