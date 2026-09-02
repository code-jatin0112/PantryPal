import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RecipeCard from '../components/recipes/RecipeCard';
import ServingScaler from '../components/recipes/ServingScaler';
import NutritionCard from '../components/recipes/NutritionCard';
import FavoriteButton from '../components/recipes/FavoriteButton';

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
});
