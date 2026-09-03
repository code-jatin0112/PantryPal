import React, { useState } from 'react';
import {
  Sparkles,
  Clock,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Play,
  BookmarkPlus,
  Check,
  ChefHat,
  DollarSign,
  PackageCheck,
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import RecommendationScoreBadge from './RecommendationScoreBadge';
import Badge from '../ui/Badge';
import { formatIngredientQuantity } from '../../utils/hoistingDemo';

const RecommendationModal = ({
  isOpen,
  onClose,
  recommendation,
  onCookNow,
  onSaveToCookbook,
}) => {
  const [saved, setSaved] = useState(false);

  if (!recommendation) return null;

  const title = recommendation.title || 'Personalized Recipe';
  const cuisine = recommendation.cuisine || 'Fusion';
  const difficulty = recommendation.difficulty || 'MEDIUM';
  const prepTime = recommendation.prepTime || 10;
  const cookTime = recommendation.cookTime || 20;
  const totalTime = prepTime + cookTime;
  const servings = recommendation.servings || 2;
  const score = recommendation.matchScore || 92;
  const cost = recommendation.estimatedCost || 6.5;

  const usedIngredients = recommendation.pantryUsage?.usedIngredients || [];
  const missingIngredients = recommendation.pantryUsage?.missingIngredients || [];
  const instructions = Array.isArray(recommendation.instructions)
    ? recommendation.instructions
    : typeof recommendation.instructions === 'string'
    ? recommendation.instructions.split('\n').filter(Boolean)
    : ['Prepare ingredients.', 'Cook until golden and tender.', 'Plate and serve warm.'];

  const nutrition = recommendation.nutrition || { calories: 420, protein: 28, carbohydrates: 36, fat: 16 };

  const handleSave = () => {
    setSaved(true);
    onSaveToCookbook?.(recommendation);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="space-y-6 text-left p-1 sm:p-2">
        {/* Header Area */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[rgba(138,144,112,0.12)]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <RecommendationScoreBadge score={score} />
              <Badge variant="neutral" size="sm">
                {cuisine}
              </Badge>
              <Badge variant="neutral" size="sm">
                {difficulty}
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-dark)] leading-tight">
              {title}
            </h2>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleSave}
              className="p-2 rounded-xl text-[var(--color-sage)] hover:text-[var(--color-dark)] hover:bg-[var(--color-parchment)] transition-colors border border-[rgba(138,144,112,0.2)] flex items-center gap-1.5 text-xs font-bold"
            >
              {saved ? (
                <>
                  <Check size={14} className="text-emerald-600" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <BookmarkPlus size={14} />
                  <span>Save Recipe</span>
                </>
              )}
            </button>
            <Button
              variant="primary"
              size="sm"
              icon={Play}
              onClick={() => onCookNow?.(recommendation)}
            >
              Cook Now
            </Button>
          </div>
        </div>

        {/* AI Rationale / Explanation Box */}
        {recommendation.reason && (
          <div className="bg-[var(--color-parchment)] p-4 rounded-2xl border border-[rgba(138,144,112,0.12)] flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-white text-amber-600 flex items-center justify-center flex-shrink-0 shadow-xs">
              <Sparkles size={16} />
            </div>
            <div>
              <span className="text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider block">
                Why AI Recommended This
              </span>
              <p className="text-xs text-[var(--color-sage)] mt-0.5 leading-relaxed font-medium">
                {recommendation.reason}
              </p>
            </div>
          </div>
        )}

        {/* Quick Meta Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-semibold text-[var(--color-sage)]">
          <div className="bg-[var(--color-parchment)] p-2.5 rounded-xl">
            <span className="block text-[10px] uppercase">Prep / Cook Time</span>
            <strong className="text-[var(--color-dark)] font-bold">{totalTime} mins ({prepTime}p / {cookTime}c)</strong>
          </div>
          <div className="bg-[var(--color-parchment)] p-2.5 rounded-xl">
            <span className="block text-[10px] uppercase">Est. Cost</span>
            <strong className="text-[var(--color-dark)] font-bold">${Number(cost).toFixed(2)}</strong>
          </div>
          <div className="bg-[var(--color-parchment)] p-2.5 rounded-xl">
            <span className="block text-[10px] uppercase">Portions</span>
            <strong className="text-[var(--color-dark)] font-bold">{servings} servings</strong>
          </div>
          <div className="bg-[var(--color-parchment)] p-2.5 rounded-xl">
            <span className="block text-[10px] uppercase">Calories</span>
            <strong className="text-[var(--color-dark)] font-bold">{Math.round(nutrition.calories || 400)} kcal</strong>
          </div>
        </div>

        {/* Ingredients Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Matched In Stock */}
          <div className="bg-[var(--color-parchment)]/50 p-4 rounded-2xl border border-[rgba(138,144,112,0.12)] space-y-2">
            <span className="text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>In Your Pantry ({usedIngredients.length})</span>
            </span>
            <ul className="space-y-1 text-xs">
              {usedIngredients.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 font-medium text-emerald-900 bg-emerald-50/70 px-2 py-1 rounded-lg">
                  <Check size={12} className="text-emerald-600" />
                  <span>{typeof item === 'string' ? item : item.name}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Missing Ingredients */}
          <div className="bg-[var(--color-parchment)]/50 p-4 rounded-2xl border border-[rgba(138,144,112,0.12)] space-y-2">
            <span className="text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-600" />
              <span>Missing from Pantry ({missingIngredients.length})</span>
            </span>
            {missingIngredients.length === 0 ? (
              <p className="text-xs text-[var(--color-sage)] font-semibold py-2">
                ✨ Zero missing items! Ready to cook immediately.
              </p>
            ) : (
              <ul className="space-y-1 text-xs">
                {missingIngredients.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 font-medium text-amber-900 bg-amber-50/70 px-2 py-1 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>{typeof item === 'string' ? item : item.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Steps Preview */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider block">
            Cooking Steps Preview
          </span>
          <ol className="space-y-2 text-xs">
            {instructions.map((step, idx) => (
              <li
                key={idx}
                className="p-2.5 rounded-xl bg-[var(--color-parchment)] border border-[rgba(138,144,112,0.10)] flex items-start gap-2.5"
              >
                <span className="w-5 h-5 rounded-full bg-[var(--color-sage)] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-[var(--color-dark)] font-medium leading-relaxed">
                  {typeof step === 'string' ? step : step.instruction || step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Modal>
  );
};

export default RecommendationModal;
