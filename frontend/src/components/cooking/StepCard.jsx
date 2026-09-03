import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Lightbulb,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Package,
} from 'lucide-react';
import Button from '../ui/Button';

const StepCard = ({
  step,
  stepIndex = 0,
  totalSteps = 1,
  isCompleted = false,
  onToggleComplete,
  onPrevious,
  onNext,
  onFinish,
}) => {
  const isLastStep = stepIndex === totalSteps - 1;
  const isFirstStep = stepIndex === 0;

  const instructionText =
    typeof step === 'string'
      ? step
      : step?.instruction || step?.description || step?.text || 'Follow standard preparation directions.';

  const stepTitle =
    step?.title || (typeof step === 'string' ? `Instruction Step ${stepIndex + 1}` : `Step ${stepIndex + 1}`);

  const estimatedTime = step?.estimatedTime || step?.time || 5;
  const ingredientsUsed = step?.ingredients || [];
  const chefTip = step?.tip || step?.chefTip || null;

  return (
    <div className="bg-white rounded-3xl border border-[rgba(138,144,112,0.18)] p-6 sm:p-8 shadow-[0_4px_20px_rgba(39,42,31,0.06)] space-y-6 flex flex-col justify-between min-h-[440px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="space-y-6"
        >
          {/* Header Row: Step Number & Estimated Time */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-2xl bg-[var(--color-sage)] text-white text-sm font-extrabold flex items-center justify-center shadow-xs">
                {stepIndex + 1}
              </span>
              <div>
                <span className="text-xs font-bold text-[var(--color-sage)] uppercase tracking-wider block">
                  Step {stepIndex + 1} of {totalSteps}
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-[var(--color-dark)] leading-tight">
                  {stepTitle}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-[var(--color-parchment)] px-3 py-1.5 rounded-xl text-xs font-bold text-[var(--color-bark)] border border-[rgba(138,144,112,0.12)]">
              <Clock size={14} className="text-[var(--color-sage)]" />
              <span>{estimatedTime} mins</span>
            </div>
          </div>

          {/* Detailed Step Instruction Text */}
          <div className="bg-[var(--color-parchment)]/50 p-5 rounded-2xl border border-[rgba(138,144,112,0.10)]">
            <p className="text-base sm:text-lg text-[var(--color-dark)] leading-relaxed font-medium">
              {instructionText}
            </p>
          </div>

          {/* Ingredients used in this step */}
          {ingredientsUsed && ingredientsUsed.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-sage)] uppercase tracking-wider">
                <Package size={13} />
                <span>Ingredients for this step</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ingredientsUsed.map((ing, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl bg-white border border-[rgba(138,144,112,0.18)] text-xs font-bold text-[var(--color-dark)] shadow-xs"
                  >
                    {typeof ing === 'string' ? ing : `${ing.name} (${ing.quantity || ''} ${ing.unit || ''})`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Optional Chef Tips Box */}
          {chefTip && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Lightbulb size={15} />
              </div>
              <div>
                <span className="text-xs font-extrabold text-amber-900 block uppercase tracking-wider">
                  Chef's Pro Tip
                </span>
                <p className="text-xs text-amber-900/90 mt-0.5 leading-relaxed font-medium">
                  {chefTip}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Footer Navigation Bar */}
      <div className="pt-4 border-t border-[rgba(138,144,112,0.12)] flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Toggle Complete button */}
        <button
          type="button"
          onClick={onToggleComplete}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border w-full sm:w-auto justify-center ${
            isCompleted
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
              : 'bg-white text-[var(--color-bark)] border-[rgba(138,144,112,0.20)] hover:bg-[var(--color-parchment)]'
          }`}
        >
          {isCompleted ? (
            <>
              <CheckCircle2 size={16} className="text-[var(--color-success)] fill-emerald-100" />
              <span>Step Completed</span>
            </>
          ) : (
            <>
              <Circle size={16} className="text-[var(--color-sage)]" />
              <span>Mark as Complete</span>
            </>
          )}
        </button>

        {/* Previous & Next/Finish Stepper */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="secondary"
            size="md"
            icon={ChevronLeft}
            disabled={isFirstStep}
            onClick={onPrevious}
            className="flex-1 sm:flex-initial"
          >
            Previous
          </Button>

          {isLastStep ? (
            <Button
              variant="primary"
              size="md"
              icon={Sparkles}
              onClick={onFinish}
              className="flex-1 sm:flex-initial bg-emerald-700 hover:bg-emerald-800"
            >
              Finish Recipe
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              icon={ChevronRight}
              iconPosition="right"
              onClick={onNext}
              className="flex-1 sm:flex-initial"
            >
              Next Step
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepCard;
