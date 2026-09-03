import React from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';

const RecommendationEmptyState = ({ onGenerate, isFiltered = false, onResetFilters }) => {
  return (
    <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-8 sm:p-12 text-center flex flex-col items-center justify-center shadow-[0_1px_3px_rgba(39,42,31,0.04)]">
      <div className="w-16 h-16 rounded-2xl bg-[rgba(138,144,112,0.10)] text-[var(--color-sage)] flex items-center justify-center mb-4 shadow-sm">
        <Sparkles size={32} />
      </div>

      <h3 className="text-lg font-bold text-[var(--color-dark)] mb-1">
        {isFiltered ? 'No matching recommendations' : 'No recommendations available yet'}
      </h3>

      <p className="text-sm text-[var(--color-sage)] max-w-sm mb-6 leading-relaxed">
        {isFiltered
          ? 'Try relaxing your diet or cooking time filters to discover more matching meals.'
          : 'Generate personalized recipe ideas matched directly to your current pantry inventory.'}
      </p>

      <div className="flex items-center gap-3">
        {isFiltered && onResetFilters && (
          <Button variant="secondary" size="md" onClick={onResetFilters}>
            Reset Filters
          </Button>
        )}
        <Button variant="primary" size="md" icon={Sparkles} onClick={onGenerate}>
          Generate Recommendations
        </Button>
      </div>
    </div>
  );
};

export default RecommendationEmptyState;
