import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MealPlanCard from '../components/mealPlans/MealPlanCard';
import MealPlanSummary from '../components/mealPlans/MealPlanSummary';
import NutritionSummary from '../components/mealPlans/NutritionSummary';

const mockPlan = {
  id: 'mp-test-1',
  name: 'Mediterranean Weekly Plan',
  startDate: '2026-09-01',
  endDate: '2026-09-07',
  dishes: [
    { id: 'd-1', dayOfWeek: 'MONDAY', mealType: 'DINNER', recipe: { title: 'Tuscan Salmon', servings: 2 } },
    { id: 'd-2', dayOfWeek: 'TUESDAY', mealType: 'LUNCH', recipe: { title: 'Quinoa Bowl', servings: 1 } },
  ],
};

describe('Meal Plans Module Test Suite', () => {
  it('renders meal plan card with plan title and dish counts', () => {
    render(
      <BrowserRouter>
        <MealPlanCard
          mealPlan={mockPlan}
          onDelete={vi.fn()}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Mediterranean Weekly Plan')).toBeInTheDocument();
    expect(screen.getByText(/2 meals/i)).toBeInTheDocument();
  });

  it('renders nutrition summary with daily calories and macronutrient totals', () => {
    const mockNutrition = {
      calories: 1950,
      protein: 145,
      carbohydrates: 180,
      fat: 65,
    };

    render(<NutritionSummary nutrition={mockNutrition} daysCount={7} />);
    expect(screen.getByText(/1950 kcal/i)).toBeInTheDocument();
    expect(screen.getByText('145g')).toBeInTheDocument();
    expect(screen.getByText('180g')).toBeInTheDocument();
    expect(screen.getByText('65g')).toBeInTheDocument();
  });

  it('renders meal plan summary with menu breakdown and dish count', () => {
    render(
      <BrowserRouter>
        <MealPlanSummary dishes={mockPlan.dishes} peopleCount={2} />
      </BrowserRouter>
    );
    expect(screen.getByText('Menu Breakdown')).toBeInTheDocument();
    expect(screen.getByText(/2 total dishes planned/i)).toBeInTheDocument();
  });
});
