import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CookingProgress from '../components/cooking/CookingProgress';
import StepCard from '../components/cooking/StepCard';
import IngredientChecklist from '../components/cooking/IngredientChecklist';

const mockStep = {
  title: 'Step 1: Marinate Chicken',
  instruction: 'Whisk yogurt, lemon juice, ginger, garlic, garam masala, and chili powder.',
  estimatedTime: 15,
};

describe('Cooking Mode Test Suite', () => {
  it('renders cooking progress bar with step progress and recipe summary', () => {
    render(
      <CookingProgress
        recipeTitle="Royal Butter Chicken"
        cuisine="Indian"
        difficulty="MEDIUM"
        totalTime={40}
        servings={4}
        currentStepIndex={0}
        totalSteps={6}
        completedStepIds={new Set()}
        onExit={vi.fn()}
        onStepSelect={vi.fn()}
      />
    );

    expect(screen.getByText('Royal Butter Chicken')).toBeInTheDocument();
    expect(screen.getByText(/40 mins/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 1 of 6/i)).toBeInTheDocument();
  });

  it('renders StepCard with step instruction and navigation controls', () => {
    const handleNext = vi.fn();
    const handleToggleComplete = vi.fn();

    render(
      <StepCard
        step={mockStep}
        stepIndex={0}
        totalSteps={5}
        isCompleted={false}
        onToggleComplete={handleToggleComplete}
        onPrevious={vi.fn()}
        onNext={handleNext}
        onFinish={vi.fn()}
      />
    );

    expect(screen.getByText(/Step 1: Marinate Chicken/i)).toBeInTheDocument();
    expect(screen.getByText(/Whisk yogurt/i)).toBeInTheDocument();

    const completeBtn = screen.getByRole('button', { name: /Mark as Complete/i });
    fireEvent.click(completeBtn);
    expect(handleToggleComplete).toHaveBeenCalled();
  });

  it('renders ingredient checklist and toggles check state', () => {
    const handleToggle = vi.fn();
    const ingredients = [
      { name: 'Chicken Thighs', quantity: 800, unit: 'g' },
      { name: 'Greek Yogurt', quantity: 150, unit: 'g' },
    ];

    render(
      <IngredientChecklist
        ingredients={ingredients}
        checkedIndices={new Set([0])}
        onToggleIngredient={handleToggle}
      />
    );

    expect(screen.getByText(/Chicken Thighs/i)).toBeInTheDocument();
    expect(screen.getByText(/Greek Yogurt/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Greek Yogurt/i));
    expect(handleToggle).toHaveBeenCalledWith(1);
  });
});
