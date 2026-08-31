import React, { memo } from "react";
import { AlertCircle, Clock, Trash2, Edit2 } from "lucide-react";
import Badge from "./Badge";

export const IngredientCard = memo(
  ({
    item,
    onEdit,
    onDelete,
    className = "",
  }) => {
    // Check expiration status
    const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
    const daysRemaining = item.expiryDate
      ? Math.ceil(
          (new Date(item.expiryDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

    const isExpiringSoon = daysRemaining !== null && daysRemaining <= 3 && !isExpired;

    return (
      <div
        className={`bg-white rounded-2xl border border-[#D8C6A5]/40 shadow-sm p-4 hover:shadow-md transition-all flex items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#FAF8F3] border border-[#D8C6A5]/50 flex items-center justify-center font-bold text-sm text-[#8A9070] shrink-0 uppercase">
            {item.name.substring(0, 2)}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h5 className="text-base font-bold text-[#272A1F] truncate">
                {item.name}
              </h5>
              {isExpired && (
                <Badge variant="danger" size="sm">
                  Expired
                </Badge>
              )}
              {isExpiringSoon && (
                <Badge variant="warning" size="sm">
                  Expiring in {daysRemaining}d
                </Badge>
              )}
            </div>

            <p className="text-xs text-[#5E5947] mt-0.5">
              <span className="font-semibold text-[#272A1F]">
                {item.quantity} {item.unit}
              </span>
              {item.category && (
                <span className="ml-2 capitalize opacity-80">
                  • {item.category}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="p-1.5 rounded-lg text-[#5E5947] hover:text-[#8A9070] hover:bg-[#FAF8F3] transition-colors cursor-pointer"
              title="Edit item"
              aria-label="Edit item"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="p-1.5 rounded-lg text-[#5E5947] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title="Delete item"
              aria-label="Delete item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

IngredientCard.displayName = "IngredientCard";

export default IngredientCard;
