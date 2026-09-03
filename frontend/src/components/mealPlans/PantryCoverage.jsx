import React from 'react';
import { PackageCheck, CheckCircle2, AlertTriangle, IndianRupee } from 'lucide-react';
import Badge from '../ui/Badge';

const PantryCoverage = ({ evaluation = null, pantryName = 'My Pantry' }) => {
  if (!evaluation) {
    return (
      <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-5 shadow-[0_1px_3px_rgba(39,42,31,0.04)]">
        <div className="flex items-center gap-2 mb-2 pb-3 border-b border-[rgba(138,144,112,0.10)]">
          <PackageCheck size={16} className="text-[var(--color-sage)]" />
          <h3 className="text-sm font-bold text-[var(--color-dark)]">Pantry Coverage</h3>
        </div>
        <p className="text-xs text-[var(--color-sage)]">
          Evaluating meal plan against active pantry stock...
        </p>
      </div>
    );
  }

  const coverageRatio = evaluation.pantryCoverage ?? evaluation.coverageRatio ?? evaluation.coveragePercentage ?? 0;
  const coveragePct = Math.round(coverageRatio <= 1 ? coverageRatio * 100 : coverageRatio);
  const estimatedCost = evaluation.estimatedCost ?? evaluation.totalCost ?? 0;
  const missingCount = evaluation.missingIngredients?.length ?? evaluation.missingItemsCount ?? 0;

  const badgeVariant = coveragePct >= 80 ? 'success' : coveragePct >= 50 ? 'warning' : 'danger';

  return (
    <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-5 sm:p-6 shadow-[0_1px_3px_rgba(39,42,31,0.04)] space-y-4">
      {/* Header with Coverage Badge */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[rgba(138,144,112,0.10)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[rgba(138,144,112,0.10)] text-[var(--color-sage)] flex items-center justify-center flex-shrink-0">
            <PackageCheck size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--color-dark)] leading-tight">
              Pantry Coverage & Feasibility
            </h3>
            <p className="text-[11px] text-[var(--color-sage)]">Matched with {pantryName}</p>
          </div>
        </div>

        <Badge variant={badgeVariant} size="md" dot>
          {coveragePct}% Stocked
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-sage)]">
          <span>{coveragePct >= 100 ? 'All ingredients in stock!' : `${missingCount} missing ingredient${missingCount !== 1 ? 's' : ''}`}</span>
          <span className="text-[var(--color-dark)] font-extrabold">{coveragePct}%</span>
        </div>
        <div className="h-2 w-full bg-[var(--color-parchment)] rounded-full overflow-hidden border border-[rgba(138,144,112,0.15)]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              coveragePct >= 80
                ? 'bg-[var(--color-success)]'
                : coveragePct >= 50
                ? 'bg-amber-500'
                : 'bg-[var(--color-danger)]'
            }`}
            style={{ width: `${coveragePct}%` }}
          />
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="bg-[var(--color-parchment)] p-3 rounded-xl border border-[rgba(138,144,112,0.10)] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <IndianRupee size={16} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[var(--color-sage)] uppercase block">
              Estimated Cost
            </span>
            <span className="text-base font-extrabold text-[var(--color-dark)] tabular-nums">
              ₹{Number(estimatedCost).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="bg-[var(--color-parchment)] p-3 rounded-xl border border-[rgba(138,144,112,0.10)] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={16} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[var(--color-sage)] uppercase block">
              Missing Items
            </span>
            <span className="text-base font-extrabold text-[var(--color-dark)] tabular-nums">
              {missingCount} items
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PantryCoverage;
