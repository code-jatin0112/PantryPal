import React from 'react';
import { CheckCircle2, Trash2 } from 'lucide-react';
import Button from '../ui/Button';

const ShoppingSummary = ({
  totalCount = 0,
  purchasedCount = 0,
  onClearPurchased,
  clearing = false,
}) => {
  const pct = totalCount > 0 ? Math.round((purchasedCount / totalCount) * 100) : 0;
  const isAllDone = totalCount > 0 && purchasedCount === totalCount;

  return (
    <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-5 sm:p-6 shadow-[0_1px_3px_rgba(39,42,31,0.04)] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[rgba(138,144,112,0.10)] text-[var(--color-sage)] flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--color-dark)] leading-tight">
              Shopping Progress
            </h3>
            <p className="text-[11px] text-[var(--color-sage)]">
              {purchasedCount} of {totalCount} items purchased ({pct}%)
            </p>
          </div>
        </div>

        {purchasedCount > 0 && onClearPurchased && (
          <Button
            variant="secondary"
            size="sm"
            icon={Trash2}
            loading={clearing}
            onClick={onClearPurchased}
            className="text-xs self-start sm:self-auto text-red-600 hover:bg-red-50 hover:border-red-200"
          >
            Clear Purchased ({purchasedCount})
          </Button>
        )}
      </div>

      {/* Progress Bar Track */}
      <div className="space-y-1.5">
        <div className="h-2.5 w-full bg-[var(--color-parchment)] rounded-full overflow-hidden border border-[rgba(138,144,112,0.15)]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isAllDone ? 'bg-[var(--color-success)]' : 'bg-[var(--color-sage)]'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ShoppingSummary;
