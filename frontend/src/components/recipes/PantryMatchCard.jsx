import React from 'react';
import { PackageCheck, CheckCircle2, AlertCircle, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge from '../ui/Badge';

const PantryMatchCard = ({ availability = null, pantryName = 'My Pantry' }) => {
  if (!availability) {
    return (
      <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-5 shadow-[0_1px_3px_rgba(39,42,31,0.04)]">
        <div className="flex items-center gap-2 mb-2 pb-3 border-b border-[rgba(138,144,112,0.10)]">
          <PackageCheck size={16} className="text-[var(--color-sage)]" />
          <h3 className="text-sm font-bold text-[var(--color-dark)]">Pantry Matching</h3>
        </div>
        <p className="text-xs text-[var(--color-sage)]">
          Checking real-time pantry inventory match...
        </p>
      </div>
    );
  }

  const ratio = availability.availabilityRatio ?? availability.matchPercentage ?? 0;
  const pct = Math.round(ratio <= 1 ? ratio * 100 : ratio);
  const availableItems = availability.availableIngredients || availability.available || [];
  const missingItems = availability.missingIngredients || availability.missing || [];
  const isReady = pct >= 100;

  const matchVariant = pct >= 80 ? 'success' : pct >= 50 ? 'warning' : 'danger';

  return (
    <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-5 sm:p-6 shadow-[0_1px_3px_rgba(39,42,31,0.04)] space-y-4">
      {/* Header with Match % */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[rgba(138,144,112,0.10)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[rgba(138,144,112,0.10)] text-[var(--color-sage)] flex items-center justify-center flex-shrink-0">
            <PackageCheck size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--color-dark)] leading-tight">
              Pantry Availability
            </h3>
            <p className="text-[11px] text-[var(--color-sage)]">Matched against {pantryName}</p>
          </div>
        </div>

        <Badge variant={matchVariant} size="md" dot>
          {pct}% In Stock
        </Badge>
      </div>

      {/* Match Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-sage)]">
          <span>{isReady ? 'Ready to cook now!' : `${availableItems.length} available, ${missingItems.length} missing`}</span>
          <span className="text-[var(--color-dark)] font-extrabold">{pct}%</span>
        </div>
        <div className="h-2 w-full bg-[var(--color-parchment)] rounded-full overflow-hidden border border-[rgba(138,144,112,0.15)]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              pct >= 80 ? 'bg-[var(--color-success)]' : pct >= 50 ? 'bg-amber-500' : 'bg-[var(--color-danger)]'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Available Ingredients */}
      {availableItems.length > 0 && (
        <div>
          <p className="text-xs font-bold text-[var(--color-dark)] mb-2 flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-[var(--color-success)]" />
            <span>In Your Pantry ({availableItems.length})</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {availableItems.map((item, idx) => (
              <span
                key={idx}
                className="text-xs font-medium px-2.5 py-1 rounded-lg bg-[var(--color-success-bg)] text-emerald-800 border border-emerald-100"
              >
                {typeof item === 'string' ? item : item.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Missing Ingredients */}
      {missingItems.length > 0 && (
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-xs font-bold text-[var(--color-dark)] flex items-center gap-1.5">
              <AlertCircle size={13} className="text-amber-600" />
              <span>Missing Ingredients ({missingItems.length})</span>
            </p>
            <Link
              to="/shopping-list"
              className="text-[11px] font-semibold text-[var(--color-sage)] hover:text-[var(--color-dark)] flex items-center gap-1"
            >
              <ShoppingCart size={11} />
              <span>Add to List</span>
            </Link>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {missingItems.map((item, idx) => (
              <span
                key={idx}
                className="text-xs font-medium px-2.5 py-1 rounded-lg bg-[var(--color-warning-bg)] text-amber-900 border border-amber-200/60"
              >
                {typeof item === 'string' ? item : `${item.name || item.ingredientName} (${item.requiredQuantity || item.quantity || ''} ${item.unit || ''})`}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PantryMatchCard;
