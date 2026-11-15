import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MealPlanCard from '../components/mealPlans/MealPlanCard';
import MealPlanSummary from '../components/mealPlans/MealPlanSummary';
import NutritionSummary from '../components/mealPlans/NutritionSummary';
import GroceryRequirements from '../components/mealPlans/GroceryRequirements';
import MealPlanForm from '../components/mealPlans/MealPlanForm';
import * as shoppingService from '../services/shoppingListService';

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

  it('renders meal plan card when dishes is provided under items', () => {
    const planWithItems = {
      id: 'mp-test-2',
      name: 'Fallback Plan',
      startDate: '2026-09-01',
      endDate: '2026-09-07',
      items: [
        { id: 'i-1', dayOfWeek: 'MONDAY', mealType: 'DINNER', recipe: { title: 'Stew', servings: 2 } },
      ],
    };
    render(
      <BrowserRouter>
        <MealPlanCard mealPlan={planWithItems} onDelete={vi.fn()} />
      </BrowserRouter>
    );
    expect(screen.getByText('Fallback Plan')).toBeInTheDocument();
    expect(screen.getByText(/1 meal/i)).toBeInTheDocument();
  });

  it('renders GroceryRequirements and displays missing items', () => {
    const mockRequirements = {
      missingItems: [
        { name: 'Olive Oil', missingQuantity: 2, unit: 'tbsp', sourceRecipe: 'Tuscan Salmon' },
      ],
    };
    render(<GroceryRequirements requirements={mockRequirements} mealPlanName="Mediterranean Plan" />);
    expect(screen.getByText('Grocery Requirements')).toBeInTheDocument();
    expect(screen.getByText('Olive Oil')).toBeInTheDocument();
    expect(screen.getByText(/Need 2 tbsp/i)).toBeInTheDocument();
  });

  it('preserves genuinely empty dish arrays when editing an existing meal plan', () => {
    const emptyExistingPlan = {
      id: 'mp-empty-1',
      name: 'Clean Empty Plan',
      startDate: '2026-09-01',
      endDate: '2026-09-07',
      dishes: [],
    };

    render(
      <BrowserRouter>
        <MealPlanForm initialData={emptyExistingPlan} onSubmit={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.getByText(/No meals scheduled yet/i)).toBeInTheDocument();
    expect(screen.queryByText('Meal #1')).not.toBeInTheDocument();

    // Adding first dish manually
    const addBtn = screen.getByRole('button', { name: /Add Meal/i });
    fireEvent.click(addBtn);
    expect(screen.getByText('Meal #1')).toBeInTheDocument();
  });

  it('GroceryRequirements: handles partial failure, retries only pending items, and disables when all added', async () => {
    const createItemMock = vi.spyOn(shoppingService, 'createShoppingListItem');

    const testRequirements = [
      { id: 'req-1', name: 'Almond Flour', missingQuantity: 200, unit: 'g' },
      { id: 'req-2', name: 'Coconut Milk', missingQuantity: 400, unit: 'ml' },
    ];

    // First attempt: Almond Flour succeeds, Coconut Milk fails
    createItemMock
      .mockResolvedValueOnce({ data: { success: true } })
      .mockRejectedValueOnce(new Error('Network error on item 2'));

    const { rerender } = render(
      <GroceryRequirements requirements={testRequirements} mealPlanName="Keto Week" />
    );

    const bulkBtn = screen.getByRole('button', { name: /Add All to Shopping List/i });
    fireEvent.click(bulkBtn);

    await waitFor(() => {
      // Almond Flour should show 'Added'
      const addedButtons = screen.getAllByRole('button', { name: /^Added$/i });
      expect(addedButtons.length).toBe(1);
    });

    // Bulk button should now say "Add Remaining (1)"
    expect(screen.getByRole('button', { name: /Add Remaining \(1\)/i })).toBeInTheDocument();

    // Retry attempt: Coconut Milk now succeeds
    createItemMock.mockResolvedValueOnce({ data: { success: true } });

    const retryBtn = screen.getByRole('button', { name: /Add Remaining \(1\)/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      // Both items should now be marked Added
      const addedButtons = screen.getAllByRole('button', { name: /^Added$/i });
      expect(addedButtons.length).toBe(2);
    });

    // Bulk button should now show "All Items Added" and be disabled
    const finishedBtn = screen.getByRole('button', { name: /All Items Added/i });
    expect(finishedBtn).toBeDisabled();

    // Reordering requirements does not corrupt added state
    const reorderedRequirements = [testRequirements[1], testRequirements[0]];
    rerender(<GroceryRequirements requirements={reorderedRequirements} mealPlanName="Keto Week" />);

    const reorderedAddedButtons = screen.getAllByRole('button', { name: /^Added$/i });
    expect(reorderedAddedButtons.length).toBe(2);

    createItemMock.mockRestore();
  });
});
