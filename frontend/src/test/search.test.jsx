import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SearchInput from '../components/search/SearchInput';
import SearchFilters from '../components/search/SearchFilters';
import SearchResultCard from '../components/search/SearchResultCard';
import RecentSearches from '../components/search/RecentSearches';

const mockResult = {
  id: 'rec-test-1',
  category: 'recipes',
  title: 'Butter Chicken Curry',
  subtitle: 'Rich spiced creamy curry',
  metadata: '35 mins • 4 servings',
  url: '/recipes/1',
  isFavorite: true,
};

describe('Global Search Test Suite', () => {
  it('renders search input with value and clears on trigger', () => {
    const handleChange = vi.fn();
    const handleClear = vi.fn();

    render(
      <SearchInput
        value="Chicken"
        onChange={handleChange}
        onClear={handleClear}
      />
    );

    expect(screen.getByDisplayValue('Chicken')).toBeInTheDocument();

    const clearButton = screen.getByRole('button', { name: /Clear search/i });
    fireEvent.click(clearButton);
    expect(handleClear).toHaveBeenCalled();
  });

  it('renders result card with category icon, title, subtitle, and action arrow', () => {
    const handleClick = vi.fn();

    render(
      <SearchResultCard
        result={mockResult}
        isSelected={false}
        onClick={handleClick}
      />
    );

    expect(screen.getByText('Butter Chicken Curry')).toBeInTheDocument();
    expect(screen.getByText('Rich spiced creamy curry')).toBeInTheDocument();
    expect(screen.getByText('Recipe')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Butter Chicken Curry'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('renders recent searches chips and triggers selection or pin', () => {
    const handleSelect = vi.fn();
    const handlePin = vi.fn();

    render(
      <RecentSearches
        recentSearches={[
          { query: 'Butter Chicken', isPinned: true },
          { query: 'Olive Oil', isPinned: false },
        ]}
        onSelectSearch={handleSelect}
        onRemoveSearch={vi.fn()}
        onTogglePin={handlePin}
        onClearAll={vi.fn()}
      />
    );

    expect(screen.getByText('Butter Chicken')).toBeInTheDocument();
    expect(screen.getByText('Olive Oil')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Olive Oil'));
    expect(handleSelect).toHaveBeenCalledWith('Olive Oil');
  });
});
