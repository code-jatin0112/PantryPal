import React from "react";
import { Filter, RotateCcw } from "lucide-react";
import Button from "./Button";

export const FilterPanel = ({
  categories = [],
  selectedCategory = "",
  onSelectCategory,
  cuisines = [],
  selectedCuisine = "",
  onSelectCuisine,
  onResetFilters,
  className = "",
}) => {
  return (
    <div
      className={`p-4 bg-white rounded-2xl border border-[#D8C6A5]/40 shadow-sm space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-[#272A1F]">
          <Filter className="w-4 h-4 text-[#8A9070]" />
          <span>Filters</span>
        </div>

        {(selectedCategory || selectedCuisine) && (
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1 text-xs font-semibold text-[#8A9070] hover:text-[#757C5F] cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Category Pills */}
      {categories.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#5E5947] uppercase tracking-wider">
            Category
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onSelectCategory("")}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-all cursor-pointer ${
                !selectedCategory
                  ? "bg-[#8A9070] text-white shadow-xs"
                  : "bg-[#FAF8F3] text-[#272A1F] hover:bg-[#B8C39A]/20"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`px-3 py-1 text-xs rounded-full capitalize font-medium transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#8A9070] text-white shadow-xs"
                    : "bg-[#FAF8F3] text-[#272A1F] hover:bg-[#B8C39A]/20"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cuisine Pills */}
      {cuisines.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-[#D8C6A5]/20">
          <label className="text-xs font-semibold text-[#5E5947] uppercase tracking-wider">
            Cuisine
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onSelectCuisine("")}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-all cursor-pointer ${
                !selectedCuisine
                  ? "bg-[#8A9070] text-white shadow-xs"
                  : "bg-[#FAF8F3] text-[#272A1F] hover:bg-[#B8C39A]/20"
              }`}
            >
              All
            </button>
            {cuisines.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onSelectCuisine(c)}
                className={`px-3 py-1 text-xs rounded-full capitalize font-medium transition-all cursor-pointer ${
                  selectedCuisine === c
                    ? "bg-[#8A9070] text-white shadow-xs"
                    : "bg-[#FAF8F3] text-[#272A1F] hover:bg-[#B8C39A]/20"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;

