import React from 'react';
import { Heart } from 'lucide-react';

const FavoriteButton = ({
  isFavorite = false,
  onClick,
  size = 'md',
  className = '',
  disabled = false,
}) => {
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
  const paddingClass = size === 'sm' ? 'p-1.5' : size === 'lg' ? 'p-2.5' : 'p-2';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      disabled={disabled}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      className={`rounded-xl border transition-all duration-150 flex items-center justify-center ${paddingClass} ${
        isFavorite
          ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
          : 'bg-white border-[rgba(138,144,112,0.20)] text-[var(--color-sage)] hover:text-red-400 hover:border-red-200'
      } ${className}`}
    >
      <Heart
        size={iconSize}
        className="transition-transform active:scale-125"
        fill={isFavorite ? 'currentColor' : 'none'}
      />
    </button>
  );
};

export default FavoriteButton;
