import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ChefHat } from 'lucide-react';
import Button from '../ui/Button';

const AIRecommendationCard = ({ recommendations = [] }) => {
  const navigate = useNavigate();

  const defaultRecipes = [
    'Vegetable Pulao',
    'Tomato Soup',
    'Fried Rice',
  ];

  const items = recommendations.length > 0
    ? recommendations.map((r) => (typeof r === 'string' ? r : r.name))
    : defaultRecipes;

  return (
    <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.22)] p-5 sm:p-6 shadow-[0_1px_3px_rgba(39,42,31,0.04)] flex flex-col justify-between relative overflow-hidden group hover:border-[var(--color-sage)] transition-all">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[rgba(184,195,154,0.12)] rounded-bl-full pointer-events-none" />

      <div>
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-xl bg-[rgba(138,144,112,0.15)] text-[var(--color-sage)] flex items-center justify-center flex-shrink-0">
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--color-dark)] leading-tight">
              AI Suggestions
            </h2>
            <p className="text-[11px] text-[var(--color-sage)]">
              Personalized based on your in-stock items
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="my-4">
          <p className="text-xs font-semibold text-[var(--color-bark)] mb-2.5">
            You can cook today:
          </p>
          <ul className="space-y-2">
            {items.map((recipe, index) => (
              <li
                key={index}
                className="flex items-center gap-2.5 text-xs font-medium text-[var(--color-dark)] bg-[var(--color-parchment)] p-2 rounded-xl"
              >
                <div className="w-5 h-5 rounded-lg bg-white border border-[rgba(138,144,112,0.2)] flex items-center justify-center text-[var(--color-sage)] flex-shrink-0">
                  <ChefHat size={11} />
                </div>
                <span className="truncate font-semibold">{recipe}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Button Action */}
      <div className="mt-2">
        <Button
          variant="primary"
          size="sm"
          fullWidth
          iconRight={ArrowRight}
          onClick={() => navigate('/recipes')}
        >
          View Recommendations
        </Button>
      </div>
    </div>
  );
};

export default AIRecommendationCard;
