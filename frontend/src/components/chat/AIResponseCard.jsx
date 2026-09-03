import React from 'react';
import {
  ChefHat,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ShoppingCart,
  Calendar,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge from '../ui/Badge';

const AIResponseCard = ({
  intent = 'general',
  relevantItems = [],
  suggestedActions = [],
  warnings = [],
  onActionClick,
}) => {
  const hasItems = relevantItems && relevantItems.length > 0;
  const hasWarnings = warnings && warnings.length > 0;
  const hasActions = suggestedActions && suggestedActions.length > 0;

  if (!hasItems && !hasWarnings && !hasActions) {
    return null;
  }

  return (
    <div className="space-y-3 pt-2 text-left">
      {/* ── Warnings Callout ── */}
      {hasWarnings && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider">
            <AlertTriangle size={13} className="text-amber-600" />
            <span>Safety & Expiry Notice</span>
          </div>
          <ul className="space-y-0.5 text-xs text-amber-900/90 font-medium list-disc list-inside">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Referenced Pantry Items ── */}
      {hasItems && (
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-[11px] font-bold text-[var(--color-sage)] uppercase tracking-wider">
            Referenced Items:
          </span>
          {relevantItems.map((item, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md bg-[var(--color-parchment)] border border-[rgba(138,144,112,0.15)] font-semibold text-[var(--color-dark)]"
            >
              {item}
            </span>
          ))}
        </div>
      )}

      {/* ── Suggested Action Chips ── */}
      {hasActions && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-[var(--color-sage)] uppercase tracking-wider block">
            Suggested Next Steps
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {suggestedActions.map((action, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onActionClick?.(action)}
                className="px-2.5 py-1 rounded-lg bg-[rgba(138,144,112,0.10)] hover:bg-[var(--color-sage)] hover:text-white text-xs font-bold text-[var(--color-bark)] border border-[rgba(138,144,112,0.20)] transition-all flex items-center gap-1"
              >
                <span>{action}</span>
                <ArrowRight size={11} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIResponseCard;
