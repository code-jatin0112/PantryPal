import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Bot } from 'lucide-react';

const THINKING_MESSAGES = [
  'Analyzing pantry stock...',
  'Thinking...',
  'Consulting culinary knowledge...',
  'Crafting recommendations...',
];

const TypingIndicator = () => {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % THINKING_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-start gap-3 text-left">
      {/* AI Bot Avatar */}
      <div className="w-8 h-8 rounded-xl bg-[var(--color-sage)] text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-1">
        <Bot size={16} />
      </div>

      {/* Bubble Container */}
      <div className="bg-white border border-[rgba(138,144,112,0.18)] rounded-2xl rounded-tl-sm p-3.5 shadow-xs space-y-1.5 max-w-sm">
        <div className="flex items-center gap-1.5">
          <motion.div
            className="w-2 h-2 rounded-full bg-[var(--color-sage)]"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="w-2 h-2 rounded-full bg-[var(--color-sage)]"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="w-2 h-2 rounded-full bg-[var(--color-sage)]"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
          />
        </div>

        <p className="text-[11px] font-semibold text-[var(--color-sage)] tracking-wide">
          {THINKING_MESSAGES[msgIdx]}
        </p>
      </div>
    </div>
  );
};

export default TypingIndicator;
