import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import StatCard from '../components/dashboard/StatCard';
import QuickActions from '../components/dashboard/QuickActions';
import { Package } from 'lucide-react';

describe('Dashboard Module Test Suite', () => {
  it('renders StatCard with title, value, and trend', () => {
    render(
      <StatCard
        title="Total Ingredients"
        value={24}
        icon={Package}
        trend={{ value: '+3', label: 'this week', positive: true }}
      />
    );

    expect(screen.getByText('Total Ingredients')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText(/\+3/)).toBeInTheDocument();
    expect(screen.getByText('this week')).toBeInTheDocument();
  });

  it('renders QuickActions with action buttons', () => {
    render(
      <BrowserRouter>
        <QuickActions />
      </BrowserRouter>
    );

    expect(screen.getAllByText('Add Pantry Item').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Add Recipe').length).toBeGreaterThan(0);
  });
});
