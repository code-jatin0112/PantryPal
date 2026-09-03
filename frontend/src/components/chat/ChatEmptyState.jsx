import React from 'react';
import { Bot, Sparkles, Utensils, ShieldCheck, Scale } from 'lucide-react';

const ChatEmptyState = ({ onSelectPrompt }) => {
  const capabilities = [
    {
      title: 'Pantry Matching',
      desc: 'Cook meals using only items already available in your kitchen stock.',
      icon: Utensils,
    },
    {
      title: 'Smart Substitutions',
      desc: 'Instantly swap missing ingredients or accommodate allergy restrictions.',
      icon: Scale,
    },
    {
      title: 'Waste Reduction & Safety',
      desc: 'Identify items nearing expiry and turn them into delicious dinners.',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="py-8 px-4 text-center max-w-xl mx-auto space-y-6">
      {/* Bot Icon */}
      <div className="w-16 h-16 mx-auto rounded-3xl bg-[rgba(138,144,112,0.12)] text-[var(--color-sage)] flex items-center justify-center shadow-xs">
        <Bot size={32} />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-xl font-extrabold text-[var(--color-dark)] tracking-tight">
          How can I help in your kitchen today?
        </h3>
        <p className="text-xs text-[var(--color-sage)] leading-relaxed">
          Ask for recipes based on your pantry stock, nutrition analysis, or culinary guidance.
        </p>
      </div>

      {/* Feature Capabilities */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
        {capabilities.map((cap, idx) => {
          const Icon = cap.icon;
          return (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-white border border-[rgba(138,144,112,0.15)] shadow-xs space-y-1"
            >
              <div className="w-6 h-6 rounded-lg bg-[var(--color-parchment)] text-[var(--color-sage)] flex items-center justify-center mb-1.5">
                <Icon size={13} />
              </div>
              <h4 className="text-xs font-bold text-[var(--color-dark)]">{cap.title}</h4>
              <p className="text-[11px] text-[var(--color-sage)] leading-normal font-medium">
                {cap.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatEmptyState;
