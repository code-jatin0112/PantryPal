import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Button — PantryPal primary button component
 *
 * Props:
 *  variant: 'primary' | 'secondary' | 'danger' | 'ghost'
 *  size:    'sm' | 'md' | 'lg'
 *  loading: boolean
 *  icon:    Lucide icon component (left side)
 *  iconRight: Lucide icon component (right side)
 *  fullWidth: boolean
 */
const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconRight: IconRight,
  fullWidth = false,
  className = '',
  disabled,
  type = 'button',
  ...props
}, ref) => {
  const variantClass = {
    primary:   'btn-primary',
    secondary: 'btn-secondary',
    danger:    'btn-danger',
    ghost:     'btn-ghost',
  }[variant];

  const sizeClass = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  }[size];

  const iconSize = {
    sm: 14,
    md: 16,
    lg: 18,
  }[size];

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`btn ${variantClass} ${sizeClass} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 size={iconSize} className="animate-spin" />
      ) : Icon ? (
        <Icon size={iconSize} />
      ) : null}
      {children}
      {!loading && IconRight && <IconRight size={iconSize} />}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
