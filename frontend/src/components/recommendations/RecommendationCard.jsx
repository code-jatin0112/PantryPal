import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Flame,
  ChefHat,
  PackageCheck,
  AlertTriangle,
  Play,
  BookmarkPlus,
  Heart,
  Eye,
  Check,
  IndianRupee,
} from 'lucide-react';
import RecommendationScoreBadge from './RecommendationScoreBadge';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const RecommendationCard = ({
  recommendation,
  onView,
  onCookNow,
  onSave,
  onFavoriteToggle,
  isFavorite = false,
  index = 0,
}) => {
  const [saved, setSaved] = useState(false);

  const title = recommendation.title || 'Personalized Recipe';
  const cuisine = recommendation.cuisine || 'Fusion';
  const difficulty = recommendation.difficulty || 'MEDIUM';
  const prepTime = recommendation.prepTime || 10;
  const cookTime = recommendation.cookTime || 20;
  const totalTime = prepTime + cookTime;

  const score = recommendation.matchScore || 90;
  const reason = recommendation.reason || 'Curated to maximize your pantry stock with minimal waste.';
  const pantryPct = recommendation.pantryUsage?.percentage || 85;
  const missingCount = recommendation.pantryUsage?.missingIngredients?.length || 0;

  const calories = recommendation.nutrition?.calories || 420;
  const protein = recommendation.nutrition?.protein || 24;
  const carbs = recommendation.nutrition?.carbohydrates || 38;
  const fat = recommendation.nutrition?.fat || 14;

  const budgetPriority = (recommendation.budgetPriority || 'medium').toLowerCase();
  const budgetSigns = budgetPriority === 'high' ? '₹₹₹' : budgetPriority === 'medium' ? '₹₹' : '₹';

  const diffVariant =
    difficulty.toUpperCase() === 'EASY'
      ? 'success'
      : difficulty.toUpperCase() === 'HARD'
      ? 'danger'
      : 'warning';

  const handleSaveClick = (e) => {
    e.stopPropagation();
    setSaved(true);
    onSave?.(recommendation);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      onClick={() => onView?.(recommendation)}
      className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] overflow-hidden shadow-[0_1px_3px_rgba(39,42,31,0.04)] hover:shadow-elevated transition-all flex flex-col justify-between group cursor-pointer"
    >
      {/* Top Banner / Image Placeholder */}
      <div className="h-36 bg-[var(--color-parchment)] border-b border-[rgba(138,144,112,0.12)] p-4 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#8A9070_1px,transparent_1px)] [background-size:12px_12px] opacity-20" />

        {/* Top Badges */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <RecommendationScoreBadge score={score} size="sm" />

          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => onFavoriteToggle?.(recommendation)}
              aria-label={isFavorite ? 'Remove favorite' : 'Add to favorites'}
              className={`p-1.5 rounded-xl border transition-all ${
                isFavorite
                  ? 'bg-red-50 border-red-200 text-red-500'
                  : 'bg-white/90 border-[rgba(138,144,112,0.2)] text-[var(--color-sage)] hover:text-red-400'
              }`}
            >
              <Heart size={14} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* Center Tag Row */}
        <div className="relative z-10 flex items-center gap-2 self-start mt-auto">
          <div className="w-8 h-8 rounded-xl bg-white/90 text-[var(--color-sage)] flex items-center justify-center shadow-xs">
            <ChefHat size={16} />
          </div>
          <span className="text-xs font-bold text-[var(--color-dark)] bg-white/80 px-2 py-0.5 rounded-md shadow-xs">
            {cuisine}
          </span>
          <span className="text-xs font-extrabold text-[var(--color-bark)] bg-white/80 px-2 py-0.5 rounded-md shadow-xs">
            {budgetSigns}
          </span>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Title & Reason */}
          <h3 className="font-extrabold text-base sm:text-lg text-[var(--color-dark)] group-hover:text-[var(--color-sage)] transition-colors line-clamp-2 leading-snug">
            {title}
          </h3>

          <p className="text-xs text-[var(--color-sage)] mt-1.5 line-clamp-2 leading-relaxed bg-[var(--color-parchment)]/60 p-2.5 rounded-xl border border-[rgba(138,144,112,0.08)]">
            💡 {reason}
          </p>

          {/* Pantry Match & Missing Ingredients */}
          <div className="mt-3 flex items-center justify-between gap-2 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-emerald-700">
              <PackageCheck size={14} />
              <span>{pantryPct}% In Stock</span>
            </div>

            <div className="flex items-center gap-1 text-[var(--color-sage)]">
              <AlertTriangle size={13} className={missingCount > 0 ? 'text-amber-500' : 'text-emerald-500'} />
              <span>{missingCount === 0 ? 'All In Stock' : `${missingCount} missing`}</span>
            </div>
          </div>

          {/* Macros Bar */}
          <div className="mt-3 grid grid-cols-4 gap-1.5 bg-[var(--color-parchment)] p-2 rounded-xl text-center text-[11px]">
            <div>
              <span className="text-[var(--color-sage)] block text-[10px]">Cals</span>
              <strong className="text-[var(--color-dark)]">{Math.round(calories)}</strong>
            </div>
            <div>
              <span className="text-[var(--color-sage)] block text-[10px]">Prot</span>
              <strong className="text-[var(--color-dark)]">{protein}g</strong>
            </div>
            <div>
              <span className="text-[var(--color-sage)] block text-[10px]">Carb</span>
              <strong className="text-[var(--color-dark)]">{carbs}g</strong>
            </div>
            <div>
              <span className="text-[var(--color-sage)] block text-[10px]">Fat</span>
              <strong className="text-[var(--color-dark)]">{fat}g</strong>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className="pt-3 border-t border-[rgba(138,144,112,0.10)] flex items-center justify-between gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleSaveClick}
            aria-label="Save recipe to cookbook"
            className="p-2 rounded-xl text-[var(--color-sage)] hover:text-[var(--color-dark)] hover:bg-[var(--color-parchment)] transition-colors border border-[rgba(138,144,112,0.18)]"
          >
            {saved ? <Check size={15} className="text-emerald-600" /> : <BookmarkPlus size={15} />}
          </button>

          <div className="flex items-center gap-2 flex-1 justify-end">
            <Button
              variant="secondary"
              size="sm"
              icon={Eye}
              onClick={() => onView?.(recommendation)}
              className="text-xs font-bold"
            >
              Preview
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Play}
              onClick={() => onCookNow?.(recommendation)}
              className="text-xs font-bold"
            >
              Cook Now
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RecommendationCard;
