import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Sparkles, RotateCcw, ArrowLeft, Heart, CheckCircle2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const CompletionModal = ({
  isOpen,
  onClose,
  recipeTitle = 'Delicious Meal',
  totalTime = 30,
  servings = 4,
  onCookAgain,
  onBackToRecipes,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="text-center p-2 sm:p-4 space-y-6">
        {/* Celebration Trophy Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="w-20 h-20 mx-auto rounded-3xl bg-amber-50 text-amber-500 border-2 border-amber-200 flex items-center justify-center shadow-lg relative"
        >
          <Trophy size={40} />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-2 -right-2 text-amber-400"
          >
            <Sparkles size={20} />
          </motion.div>
        </motion.div>

        {/* Text Header */}
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-dark)] tracking-tight">
            Bon Appétit! 🎉
          </h2>
          <p className="text-sm text-[var(--color-sage)] max-w-md mx-auto leading-relaxed">
            You've successfully prepared <strong className="text-[var(--color-dark)]">{recipeTitle}</strong>! Time to plate and enjoy your homemade feast.
          </p>
        </div>

        {/* Summary Chips */}
        <div className="flex items-center justify-center gap-3 text-xs font-bold text-[var(--color-bark)]">
          <span className="px-3 py-1.5 rounded-xl bg-[var(--color-parchment)] border border-[rgba(138,144,112,0.15)] flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-[var(--color-success)]" />
            <span>All Steps Done</span>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-[var(--color-parchment)] border border-[rgba(138,144,112,0.15)]">
            {totalTime} Mins Total
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-[var(--color-parchment)] border border-[rgba(138,144,112,0.15)]">
            {servings} Portions
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-[rgba(138,144,112,0.12)]">
          <Button
            type="button"
            variant="secondary"
            size="md"
            icon={RotateCcw}
            onClick={onCookAgain}
            className="w-full sm:w-auto"
          >
            Cook Again
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            icon={ArrowLeft}
            onClick={onBackToRecipes}
            className="w-full sm:w-auto"
          >
            Back to Recipes
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CompletionModal;
