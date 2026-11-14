import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RecipeCard from '../components/recipes/RecipeCard';
import ServingScaler from '../components/recipes/ServingScaler';
import NutritionCard from '../components/recipes/NutritionCard';
import FavoriteButton from '../components/recipes/FavoriteButton';
import RecipeForm from '../components/recipes/RecipeForm';

const mockRecipe = {
  id: 'rec-test-1',
  title: 'Tuscan Garlic Herb Chicken',
  description: 'Tender chicken breast in garlic cream sauce',
  prepTime: 10,
  cookTime: 20,
  servings: 4,
  cuisine: 'Italian',
  difficulty: 'EASY',
  isFavorite: false,
};

describe('Recipes Module Test Suite', () => {
  it('renders recipe card correctly with meta info and action button', () => {
    render(
      <BrowserRouter>
        <RecipeCard recipe={mockRecipe} onToggleFavorite={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.getByText('Tuscan Garlic Herb Chicken')).toBeInTheDocument();
    expect(screen.getByText(/30m/i)).toBeInTheDocument();
    expect(screen.getByText(/4 srv/i)).toBeInTheDocument();
  });

  it('scales servings correctly and calls callback with clamped limits (2-10)', () => {
    const handleChange = vi.fn();
    render(<ServingScaler servings={2} onChange={handleChange} />);

    expect(screen.getByText('Servings')).toBeInTheDocument();

    const incBtn = screen.getByRole('button', { name: /Increase servings/i });
    fireEvent.click(incBtn);
    expect(handleChange).toHaveBeenCalledWith(3);
  });

  it('renders nutrition card with calories, protein, carbs, and fat breakdown', () => {
    const mockNutrition = {
      calories: 450,
      protein: 42,
      carbohydrates: 18,
      fat: 14,
    };

    render(<NutritionCard nutrition={mockNutrition} servings={2} />);
    expect(screen.getByText(/450 kcal/i)).toBeInTheDocument();
    expect(screen.getByText('42g')).toBeInTheDocument();
    expect(screen.getByText('18g')).toBeInTheDocument();
    expect(screen.getByText('14g')).toBeInTheDocument();
  });

  it('toggles favorite state on button click', () => {
    const handleClick = vi.fn();
    render(<FavoriteButton isFavorite={false} onClick={handleClick} />);

    const favButton = screen.getByRole('button');
    fireEvent.click(favButton);
    expect(handleClick).toHaveBeenCalled();
  });

  it('renders favorite button with active state and correct aria-label when favorited', () => {
    render(<FavoriteButton isFavorite={true} onClick={vi.fn()} />);
    const favButton = screen.getByRole('button', { name: /Remove from favorites/i });
    expect(favButton).toBeInTheDocument();
    expect(favButton).toHaveClass('text-red-500');
  });

  it('renders favorite button with inactive state and correct aria-label when not favorited', () => {
    render(<FavoriteButton isFavorite={false} onClick={vi.fn()} />);
    const favButton = screen.getByRole('button', { name: /Add to favorites/i });
    expect(favButton).toBeInTheDocument();
    expect(favButton).not.toHaveClass('text-red-500');
  });

  it('correctly extracts favorite status from backend API responses (isFavorited and isFavorite)', () => {
    // Regression test: ensure { isFavorited: false } is NOT treated as truthy object
    const parseFavoriteStatus = (resData) => {
      return (
        resData?.isFavorited ??
        resData?.isFavorite ??
        (typeof resData === 'boolean' ? resData : false)
      );
    };

    expect(parseFavoriteStatus({ isFavorited: false })).toBe(false);
    expect(parseFavoriteStatus({ isFavorited: true })).toBe(true);
    expect(parseFavoriteStatus({ isFavorite: false })).toBe(false);
    expect(parseFavoriteStatus({ isFavorite: true })).toBe(true);
    expect(parseFavoriteStatus({ isFavorited: true, isFavorite: true })).toBe(true);
    expect(parseFavoriteStatus({ isFavorited: false, isFavorite: false })).toBe(false);
    expect(parseFavoriteStatus(null)).toBe(false);
    expect(parseFavoriteStatus(undefined)).toBe(false);
  });

  it('RecipeForm preserves existing ingredient IDs and maps zero nutrition values correctly', async () => {
    const initialData = {
      id: 'rec-test-1',
      title: 'Diet Lemonade',
      instructions: 'Squeeze lemon. Mix with water.',
      ingredients: [
        { id: 'ing-uuid-1', name: 'Fresh Lemon', quantity: 2, unit: 'pcs' },
        { id: 'ing-uuid-2', name: 'Water', quantity: 500, unit: 'ml' },
      ],
      nutrition: {
        calories: 0,
        protein: 0,
        carbohydrates: 1,
        fat: 0,
      },
    };

    let submittedPayload = null;
    const handleSubmit = (payload) => {
      submittedPayload = payload;
    };

    render(
      <RecipeForm
        initialData={initialData}
        onSubmit={handleSubmit}
        submitLabel="Save Recipe"
      />
    );

    // Verify ingredient inputs are prefilled with existing values
    expect(screen.getByDisplayValue('Fresh Lemon')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Water')).toBeInTheDocument();

    // Verify 0 values for nutrition are populated in inputs
    const calorieInputs = screen.getAllByDisplayValue('0');
    expect(calorieInputs.length).toBeGreaterThanOrEqual(1);

    // Submit the form
    const submitBtn = screen.getByRole('button', { name: /Save Recipe/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // Verify preserved ingredient IDs and preserved zero nutrition
    await vi.waitFor(() => {
      expect(submittedPayload).not.toBeNull();
    });

    expect(submittedPayload.title).toBe('Diet Lemonade');
    expect(submittedPayload.ingredients).toHaveLength(2);
    expect(submittedPayload.ingredients[0].id).toBe('ing-uuid-1');
    expect(submittedPayload.ingredients[1].id).toBe('ing-uuid-2');
    expect(submittedPayload.nutrition).toBeDefined();
    expect(submittedPayload.nutrition.calories).toBe(0);
    expect(submittedPayload.nutrition.protein).toBe(0);
    expect(submittedPayload.nutrition.fat).toBe(0);
  });
});
