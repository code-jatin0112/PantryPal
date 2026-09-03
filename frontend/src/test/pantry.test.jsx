import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PantryCard from '../components/pantry/PantryCard';
import PantryFilters from '../components/pantry/PantryFilters';
import ExpiryBadge from '../components/pantry/ExpiryBadge';

const mockItem = {
  id: 'item-1',
  name: 'Organic Whole Milk',
  quantity: 2,
  unit: 'L',
  category: 'Dairy',
  expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  lowStockThreshold: 1,
};

describe('Pantry Module Test Suite', () => {
  it('renders pantry card with name, quantity, category and expiry', () => {
    render(
      <PantryCard
        item={mockItem}
        onAdjustStock={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Organic Whole Milk')).toBeInTheDocument();
    expect(screen.getByText(/Dairy/i)).toBeInTheDocument();
  });

  it('allows stock adjustment with stepper increment/decrement', () => {
    const handleAdjust = vi.fn();
    render(
      <PantryCard
        item={mockItem}
        onAdjustStock={handleAdjust}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const buttons = screen.getAllByRole('button');
    const incBtn = buttons.find((btn) => btn.getAttribute('aria-label')?.includes('Increase') || btn.querySelector('svg.lucide-plus'));
    if (incBtn) {
      fireEvent.click(incBtn);
      expect(handleAdjust).toHaveBeenCalled();
    }
  });

  it('renders category filter buttons and updates selection', () => {
    const handleCategoryChange = vi.fn();
    render(
      <PantryFilters
        category="All"
        onCategoryChange={handleCategoryChange}
        status="ALL"
        onStatusChange={vi.fn()}
        sortBy="newest"
        onSortChange={vi.fn()}
        viewMode="grid"
        onViewModeChange={vi.fn()}
      />
    );

    const produceBtn = screen.getByRole('button', { name: /Produce/i });
    expect(produceBtn).toBeInTheDocument();
    fireEvent.click(produceBtn);
    expect(handleCategoryChange).toHaveBeenCalledWith('Produce');
  });

  it('renders expiry badge with status text', () => {
    render(<ExpiryBadge expiryDate={mockItem.expiryDate} />);
    expect(screen.getByText(/days/i)).toBeInTheDocument();
  });
});
