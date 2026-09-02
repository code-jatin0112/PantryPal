import React from 'react';
import { Sparkles } from 'lucide-react';

const RecommendationScoreBadge = ({ score = 90, size = 'md' }) => {
  const normalized = Math.round(score <= 1 ? score * 100 : score);

  const getTierStyles = () => {
    if (normalized >= 90) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-200/50';
    }
    if (normalized >= 80) {
      return 'bg-[rgba(138,144,112,0.15)] text-[var(--color-bark)] border-[rgba(138,144,112,0.30)]';
    }
    return 'bg-amber-50 text-amber-800 border-amber-300';
  };

  const isSmall = size === 'sm';

  return (
    <div
      className={`inline-flex items-center gap-1.5 font-extrabold rounded-xl border tracking-tight shadow-xs ${
        isSmall ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      } ${getTierStyles()}`}
    >
      <Sparkles size={isSmall ? 10 : 12} className="text-amber-500 flex-shrink-0" />
      <span>{normalized}% AI Match</span>
    </div>
  );
};

export default RecommendationScoreBadge;
