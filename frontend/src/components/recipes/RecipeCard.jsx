import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, ChefHat, Flame, Sparkles } from 'lucide-react';
import FavoriteButton from './FavoriteButton';
import Badge from '../ui/Badge';

const RecipeCard = ({
  recipe,
  isFavorite = false,
  onFavoriteToggle,
  pantryMatch = null,
  onClick,
  index = 0,
}) => {
  const title = recipe.title || recipe.name || 'Untitled Recipe';
  const prepTime = recipe.prepTime || 0;
  const cookTime = recipe.cookTime || 0;
  const totalTime = prepTime + cookTime || cookTime || prepTime;
  const servings = recipe.servings || 2;
  const difficulty = recipe.difficulty || 'MEDIUM';
  const cuisine = recipe.cuisine || recipe.cuisineType;
  const category = recipe.category;

  const difficultyVariant =
    difficulty.toUpperCase() === 'EASY'
      ? 'success'
      : difficulty.toUpperCase() === 'HARD'
      ? 'danger'
      : 'warning';

  const matchPct =
    pantryMatch !== null && pantryMatch !== undefined
      ? Math.round(pantryMatch <= 1 ? pantryMatch * 100 : pantryMatch)
      : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      onClick={onClick}
      className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] overflow-hidden shadow-[0_1px_3px_rgba(39,42,31,0.04)] hover:shadow-elevated transition-all flex flex-col justify-between group cursor-pointer"
    >
      {/* Card Visual Header / Image Placeholder */}
      <div className="h-36 bg-[var(--color-parchment)] border-b border-[rgba(138,144,112,0.12)] p-4 flex flex-col justify-between relative overflow-hidden">
        {/* Background decorative pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#8A9070_1px,transparent_1px)] [background-size:12px_12px] opacity-20" />

        {/* Top Badges */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant={difficultyVariant} size="sm">
              {difficulty}
            </Badge>
            {matchPct !== null && (
              <Badge
                variant={matchPct >= 80 ? 'success' : matchPct >= 50 ? 'warning' : 'danger'}
                size="sm"
                dot
              >
                {matchPct}% Match
              </Badge>
            )}
          </div>

          <FavoriteButton
            isFavorite={isFavorite}
            onClick={onFavoriteToggle}
            size="sm"
            className="shadow-sm"
          />
        </div>

        {/* Center icon placeholder */}
        <div className="relative z-10 flex items-center gap-2 self-start mt-auto">
          <div className="w-8 h-8 rounded-xl bg-white/90 text-[var(--color-sage)] flex items-center justify-center shadow-sm">
            <ChefHat size={16} />
          </div>
          {cuisine && (
            <span className="text-xs font-bold text-[var(--color-dark)] bg-white/80 px-2 py-0.5 rounded-md shadow-xs">
              {cuisine}
            </span>
          )}
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-extrabold text-[var(--color-dark)] text-base group-hover:text-[var(--color-sage)] transition-colors line-clamp-2 leading-snug">
            {title}
          </h3>

          {category && (
            <p className="text-[11px] font-semibold text-[var(--color-sage)] mt-1 truncate">
              {category}
            </p>
          )}

          {recipe.description && (
            <p className="text-xs text-[var(--color-sage)] mt-2 line-clamp-2 leading-relaxed opacity-90">
              {recipe.description}
            </p>
          )}
        </div>

        {/* Meta details footer */}
        <div className="mt-4 pt-3 border-t border-[rgba(138,144,112,0.10)] flex items-center justify-between text-xs text-[var(--color-sage)] font-semibold">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{totalTime ? `${totalTime}m` : 'Quick'}</span>
          </div>

          <div className="flex items-center gap-1">
            <Users size={12} />
            <span>{servings} srv</span>
          </div>

          {recipe.nutrition?.calories ? (
            <div className="flex items-center gap-1 text-[var(--color-bark)]">
              <Flame size={12} className="text-amber-500" />
              <span>{Math.round(recipe.nutrition.calories)} kcal</span>
            </div>
          ) : (
            <span className="opacity-40">•</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default RecipeCard;
