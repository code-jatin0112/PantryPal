import React from "react";
import { Search, X } from "lucide-react";

export const SearchBar = ({
  value,
  onChange,
  onClear,
  placeholder = "Search...",
  className = "",
}) => {
  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <div className="absolute left-3.5 pointer-events-none text-[#5E5947]/70 flex items-center">
        <Search className="w-4 h-4" aria-hidden="true" />
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white text-[#272A1F] placeholder-[#5E5947]/50 text-sm rounded-xl border border-[#D8C6A5]/60 pl-10 pr-10 py-2.5 shadow-sm focus:outline-none focus:border-[#8A9070] focus:ring-2 focus:ring-[#8A9070]/20 transition-all"
      />

      {value && (
        <button
          type="button"
          onClick={onClear || (() => onChange(""))}
          className="absolute right-3 p-1 rounded-lg text-[#5E5947]/70 hover:text-[#272A1F] hover:bg-black/5 transition-colors cursor-pointer"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
