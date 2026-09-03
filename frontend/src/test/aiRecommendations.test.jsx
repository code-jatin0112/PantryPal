import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RecommendationScoreBadge from '../components/recommendations/RecommendationScoreBadge';
import RecommendationCard from '../components/recommendations/RecommendationCard';
import RecommendationFilters from '../components/recommendations/RecommendationFilters';

const mockRec = {
  id: 'rec-ai-1',
  title: 'Tuscan Garlic Salmon',
  description: 'Pan-seared salmon with garlic cream spinach sauce',
  matchScore: 96,
  prepTime: 10,
  cookTime: 15,
  servings: 2,
  cuisine: 'Mediterranean',
  difficulty: 'EASY',
  usedPantryIngredients: ['Salmon Fillets', 'Fresh Baby Spinach', 'Garlic'],
  missingIngredients: ['Heavy Cream'],
  matchReason: 'Utilizes spinach and garlic nearing expiration',
};

describe('AI Recommendations Module Test Suite', () => {
  it('renders match score badge with percentage and indicator', () => {
    render(<RecommendationScoreBadge score={96} size="md" />);
    expect(screen.getByText(/96% AI Match/i)).toBeInTheDocument();
  });

  it('renders recommendation card with title and cuisine tag', () => {
    render(
      <RecommendationCard
        recommendation={mockRec}
        onSelect={vi.fn()}
        onStartCooking={vi.fn()}
      />
    );

    expect(screen.getByText('Tuscan Garlic Salmon')).toBeInTheDocument();
    expect(screen.getByText('Mediterranean')).toBeInTheDocument();
    expect(screen.getByText(/96% AI Match/i)).toBeInTheDocument();
  });

  it('renders filter pills and updates active filter', () => {
    const handleDietToggle = vi.fn();
    render(
      <RecommendationFilters
        diet={['High Protein']}
        onDietToggle={handleDietToggle}
        budget="ALL"
        onBudgetChange={vi.fn()}
        maxTime="ALL"
        onMaxTimeChange={vi.fn()}
        difficulty="ALL"
        onDifficultyChange={vi.fn()}
        cuisine="ALL"
        onCuisineChange={vi.fn()}
        mealType="All"
        onMealTypeChange={vi.fn()}
        onReset={vi.fn()}
      />
    );

    const ketoBtn = screen.getByRole('button', { name: /Keto/i });
    fireEvent.click(ketoBtn);
    expect(handleDietToggle).toHaveBeenCalledWith('Keto');
  });
});
