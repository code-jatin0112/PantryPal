import React from 'react';
import { motion } from 'framer-motion';
import { ChefHat, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const CookingProgress = ({
  recipeTitle = 'Cooking Mode',
  cuisine = 'General',
  difficulty = 'MEDIUM',
  totalTime = 30,
  servings = 4,
  currentStepIndex = 0,
  totalSteps = 1,
  completedStepIds = new Set(),
  onExit,
  onStepSelect,
}) => {
  const completedCount = completedStepIds.size;
  const progressPct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  const difficultyVariant =
    difficulty.toUpperCase() === 'EASY'
      ? 'success'
      : difficulty.toUpperCase() === 'HARD'
      ? 'danger'
      : 'warning';

  return (
    <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-4 sm:p-5 shadow-[0_1px_3px_rgba(39,42,31,0.04)] space-y-4">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Recipe info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgba(138,144,112,0.12)] text-[var(--color-sage)] flex items-center justify-center flex-shrink-0 shadow-xs">
            <ChefHat size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-extrabold text-[var(--color-dark)] leading-tight">
                {recipeTitle}
              </h1>
              <Badge variant={difficultyVariant} size="sm">
                {difficulty}
              </Badge>
              {cuisine && (
                <span className="text-[11px] font-bold text-[var(--color-sage)] px-2 py-0.5 rounded-md bg-[var(--color-parchment)]">
                  {cuisine}
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-[var(--color-sage)] mt-0.5">
              {totalTime} mins • {servings} servings • Step {currentStepIndex + 1} of {totalSteps}
            </p>
          </div>
        </div>

        {/* Right: Exit Button */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowLeft}
            onClick={onExit}
            className="text-xs font-bold"
          >
            Exit Cooking
          </Button>
        </div>
      </div>

      {/* Progress Bar & Step Numbers */}
      <div className="space-y-2 pt-1 border-t border-[rgba(138,144,112,0.10)]">
        <div className="flex items-center justify-between text-xs font-bold text-[var(--color-sage)]">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-[var(--color-sage)]" />
            <span>{completedCount} of {totalSteps} steps completed</span>
          </span>
          <span className="text-[var(--color-dark)] font-extrabold">{progressPct}%</span>
        </div>

        {/* Track */}
        <div className="h-2.5 w-full bg-[var(--color-parchment)] rounded-full overflow-hidden border border-[rgba(138,144,112,0.15)]">
          <motion.div
            className="h-full bg-[var(--color-sage)] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>

        {/* Step Chips selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
          {Array.from({ length: totalSteps }).map((_, idx) => {
            const isCompleted = completedStepIds.has(idx);
            const isCurrent = currentStepIndex === idx;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => onStepSelect?.(idx)}
                aria-label={`Jump to step ${idx + 1}`}
                className={`flex-shrink-0 w-7 h-7 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center ${
                  isCurrent
                    ? 'bg-[var(--color-dark)] text-white shadow-sm ring-2 ring-[var(--color-sage)] ring-offset-1'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-[var(--color-parchment)] text-[var(--color-bark)] hover:bg-[rgba(138,144,112,0.18)]'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CookingProgress;
