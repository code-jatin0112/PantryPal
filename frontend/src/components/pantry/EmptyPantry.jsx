import React from 'react';
import { PackageOpen, Plus } from 'lucide-react';
import Button from '../ui/Button';

const EmptyPantry = ({ onAddItem, isFiltered = false, onResetFilters }) => {
  return (
    <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-8 sm:p-12 text-center flex flex-col items-center justify-center shadow-[0_1px_3px_rgba(39,42,31,0.04)]">
      <div className="w-16 h-16 rounded-2xl bg-[rgba(138,144,112,0.10)] text-[var(--color-sage)] flex items-center justify-center mb-4 shadow-sm">
        <PackageOpen size={32} />
      </div>

      <h3 className="text-lg font-bold text-[var(--color-dark)] mb-1">
        {isFiltered ? 'No matching ingredients found' : 'Your pantry is empty'}
      </h3>

      <p className="text-sm text-[var(--color-sage)] max-w-sm mb-6 leading-relaxed">
        {isFiltered
          ? 'Try adjusting your search keywords, status filters, or category selection.'
          : 'Start tracking what you have in stock to get smart expiry reminders and AI recipe suggestions.'}
      </p>

      <div className="flex items-center gap-3">
        {isFiltered && onResetFilters && (
          <Button variant="secondary" size="md" onClick={onResetFilters}>
            Reset Filters
          </Button>
        )}
        <Button variant="primary" size="md" icon={Plus} onClick={onAddItem}>
          Add Item
        </Button>
      </div>
    </div>
  );
};

export default EmptyPantry;
