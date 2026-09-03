import React from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, DollarSign, Zap, PackageCheck, HeartPulse } from 'lucide-react';

const RecommendationInsights = ({ recommendations = [], onSelectRecommendation }) => {
  if (!recommendations || recommendations.length === 0) return null;

  // 1. Best Protein Choice
  const bestProtein = [...recommendations].sort(
    (a, b) => (b.nutrition?.protein || 0) - (a.nutrition?.protein || 0)
  )[0];

  // 2. Most Budget Friendly
  const mostBudget = [...recommendations].sort(
    (a, b) => (a.estimatedCost || 999) - (b.estimatedCost || 999)
  )[0];

  // 3. Fastest Recipe
  const fastest = [...recommendations].sort(
    (a, b) => ((a.prepTime || 0) + (a.cookTime || 0)) - ((b.prepTime || 0) + (b.cookTime || 0))
  )[0];

  // 4. Highest Pantry Match
  const highestMatch = [...recommendations].sort(
    (a, b) => (b.pantryUsage?.percentage || 0) - (a.pantryUsage?.percentage || 0)
  )[0];

  // 5. Healthiest / Lowest Calorie High Nutrient
  const healthiest = [...recommendations].sort(
    (a, b) => (a.nutrition?.calories || 999) - (b.nutrition?.calories || 999)
  )[0];

  const insights = [
    {
      title: 'Best Protein Choice',
      badge: `${bestProtein?.nutrition?.protein || 36}g Protein`,
      recipe: bestProtein,
      icon: Dumbbell,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      title: 'Most Budget Friendly',
      badge: `$${Number(mostBudget?.estimatedCost || 4.2).toFixed(2)} est.`,
      recipe: mostBudget,
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      title: 'Fastest Prep & Cook',
      badge: `${(fastest?.prepTime || 5) + (fastest?.cookTime || 10)} mins total`,
      recipe: fastest,
      icon: Zap,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      title: 'Highest Pantry Match',
      badge: `${highestMatch?.pantryUsage?.percentage || 95}% in stock`,
      recipe: highestMatch,
      icon: PackageCheck,
      color: 'text-[var(--color-sage)] bg-[rgba(138,144,112,0.12)] border-[rgba(138,144,112,0.25)]',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
          AI Smart Highlights
        </h3>
        <span className="text-[11px] text-[var(--color-sage)] font-semibold">
          Optimized by Gemini AI
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {insights.map((item, idx) => {
          const Icon = item.icon;
          if (!item.recipe) return null;

          return (
            <motion.div
              key={idx}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              onClick={() => onSelectRecommendation?.(item.recipe)}
              className="bg-white p-3.5 rounded-2xl border border-[rgba(138,144,112,0.18)] shadow-[0_1px_3px_rgba(39,42,31,0.04)] hover:shadow-elevated transition-all cursor-pointer flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-[var(--color-sage)] uppercase truncate">
                  {item.title}
                </span>
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}
                >
                  <Icon size={12} />
                </div>
              </div>

              <div>
                <h4 className="text-xs font-extrabold text-[var(--color-dark)] line-clamp-1 leading-snug">
                  {item.recipe.title}
                </h4>
                <span className="text-[10px] font-bold text-[var(--color-bark)] mt-1 inline-block px-2 py-0.5 rounded-md bg-[var(--color-parchment)]">
                  {item.badge}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationInsights;
