import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { CardSkeleton } from '../ui/Skeleton';

const AI_MESSAGES = [
  'Analyzing pantry inventory & ingredient expiration dates...',
  'Checking your dietary preferences, restrictions & budget...',
  'Crafting balanced, waste-reducing recipes with Gemini AI...',
  'Evaluating nutritional macros & ranking top recommendations...',
];

const RecommendationSkeleton = () => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % AI_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Friendly AI banner with animated text */}
      <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-6 text-center space-y-3 shadow-sm">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-[rgba(138,144,112,0.12)] text-[var(--color-sage)] flex items-center justify-center animate-pulse">
          <Sparkles size={24} />
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-extrabold text-[var(--color-dark)]">
            AI Recipe Engine Working
          </h3>
          <p className="text-xs text-[var(--color-sage)] font-semibold min-h-[18px] transition-all duration-300">
            {AI_MESSAGES[msgIndex]}
          </p>
        </div>

        {/* Pulsing indicator */}
        <div className="h-1.5 w-48 mx-auto bg-[var(--color-parchment)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--color-sage)] rounded-full animate-pulse w-3/4" />
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, idx) => (
          <CardSkeleton key={idx} />
        ))}
      </div>
    </div>
  );
};

export default RecommendationSkeleton;
