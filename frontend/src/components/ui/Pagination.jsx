import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "./Button";

export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = "",
}) => {
  if (totalPages <= 1) return null;

  return (
    <div
      className={`flex items-center justify-between gap-4 py-4 select-none ${className}`}
      aria-label="Pagination Navigation"
    >
      <Button
        variant="outline"
        size="sm"
        icon={ChevronLeft}
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </Button>

      <div className="flex items-center gap-1.5 text-sm font-medium text-[#272A1F]">
        <span>Page</span>
        <span className="px-2.5 py-1 rounded-lg bg-white border border-[#D8C6A5]/50 font-bold shadow-xs">
          {currentPage}
        </span>
        <span>of {totalPages}</span>
      </div>

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <span>Next</span>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default Pagination;
