import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Package, MessageSquareText } from 'lucide-react';
import Button from '../ui/Button';

const RecommendationEmptyState = ({ onGenerate, isFiltered = false, onResetFilters }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-8 sm:p-12 text-center flex flex-col items-center justify-center shadow-[0_1px_3px_rgba(39,42,31,0.04)]">
      <div className="w-16 h-16 rounded-2xl bg-[rgba(138,144,112,0.10)] text-[var(--color-sage)] flex items-center justify-center mb-4 shadow-sm">
        <Sparkles size={32} />
      </div>

      <h3 className="text-lg font-bold text-[var(--color-dark)] mb-1">
        {isFiltered ? 'No matching recommendations' : 'No recommendations available yet'}
      </h3>

      <p className="text-sm text-[var(--color-sage)] max-w-md mb-6 leading-relaxed">
        {isFiltered
          ? 'Try relaxing your diet or cooking time filters to discover more matching meals.'
          : 'AI recommendations are generated dynamically based on your available pantry stock. Add items to your pantry or ask the AI chef directly!'}
      </p>

      <div className="flex items-center gap-3 flex-wrap justify-center">
        {isFiltered && onResetFilters && (
          <Button variant="secondary" size="md" onClick={onResetFilters}>
            Reset Filters
          </Button>
        )}
        <Button variant="secondary" size="md" icon={Package} onClick={() => navigate('/pantry')}>
          Manage Pantry
        </Button>
        <Button variant="secondary" size="md" icon={MessageSquareText} onClick={() => navigate('/ai-chat')}>
          Ask AI Chef
        </Button>
        <Button variant="primary" size="md" icon={Sparkles} onClick={onGenerate}>
          Generate Recommendations
        </Button>
      </div>
    </div>
  );
};

export default RecommendationEmptyState;
