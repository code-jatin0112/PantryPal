import React from 'react';
import { Sparkles, Utensils, Egg, Clock, Flame, ShieldAlert, Calendar } from 'lucide-react';

const QUICK_PROMPTS = [
  { text: 'What can I cook tonight?', icon: Utensils },
  { text: 'Use my pantry ingredients', icon: Sparkles },
  { text: 'Suggest a healthy breakfast', icon: Flame },
  { text: 'How can I replace eggs?', icon: Egg },
  { text: 'Generate a meal plan', icon: Calendar },
  { text: 'Reduce food waste', icon: ShieldAlert },
  { text: 'What expires this week?', icon: Clock },
];

const QuickPromptBar = ({ onSelectPrompt, disabled = false }) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1.5">
      {QUICK_PROMPTS.map((item, idx) => {
        const Icon = item.icon;
        return (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelectPrompt(item.text)}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-white border border-[rgba(138,144,112,0.18)] hover:border-[var(--color-sage)] hover:bg-[var(--color-parchment)] text-xs font-bold text-[var(--color-bark)] transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-40"
          >
            <Icon size={12} className="text-[var(--color-sage)]" />
            <span>{item.text}</span>
          </button>
        );
      })}
    </div>
  );
};

export default QuickPromptBar;
