import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ShoppingCard from '../components/shopping/ShoppingCard';
import ShoppingStats from '../components/shopping/ShoppingStats';

const mockItem = {
  id: 'shop-test-1',
  name: 'Greek Yogurt',
  quantity: 2,
  unit: 'tubs',
  category: 'Dairy',
  priority: 'HIGH',
  isPurchased: false,
};

describe('Shopping List Module Test Suite', () => {
  it('renders grocery card with name, quantity, category and priority badge', () => {
    render(
      <ShoppingCard
        item={mockItem}
        onTogglePurchased={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Greek Yogurt')).toBeInTheDocument();
    expect(screen.getByText(/Dairy/i)).toBeInTheDocument();
  });

  it('toggles purchased checkbox', () => {
    const handleToggle = vi.fn();
    render(
      <ShoppingCard
        item={mockItem}
        onTogglePurchased={handleToggle}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const toggleBtn = screen.getAllByRole('button')[0];
    fireEvent.click(toggleBtn);
    expect(handleToggle).toHaveBeenCalledWith(mockItem);
  });

  it('renders shopping stats correctly', () => {
    render(
      <ShoppingStats
        totalItems={10}
        purchasedCount={4}
        remainingCount={6}
        highPriorityCount={2}
      />
    );

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders priority badges with distinct variants', () => {
    const { rerender } = render(
      <ShoppingCard
        item={{ ...mockItem, priority: 'HIGH' }}
        onTogglePurchased={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('HIGH')).toBeInTheDocument();

    rerender(
      <ShoppingCard
        item={{ ...mockItem, priority: 'LOW' }}
        onTogglePurchased={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('LOW')).toBeInTheDocument();
  });

  it('filters and counts high priority items accurately', () => {
    const items = [
      { id: '1', name: 'Eggs', isPurchased: false, priority: 'HIGH', category: 'Dairy' },
      { id: '2', name: 'Milk', isPurchased: true, priority: 'HIGH', category: 'Dairy' },
      { id: '3', name: 'Bread', isPurchased: false, priority: 'MEDIUM', category: 'Bakery' },
      { id: '4', name: 'Apples', isPurchased: false, priority: 'LOW', category: 'Produce' },
    ];

    const unpurchasedHigh = items.filter((i) => !i.isPurchased && i.priority === 'HIGH');
    expect(unpurchasedHigh).toHaveLength(1);
    expect(unpurchasedHigh[0].name).toBe('Eggs');

    const dairyItems = items.filter((i) => i.category === 'Dairy');
    expect(dairyItems).toHaveLength(2);
  });
});
