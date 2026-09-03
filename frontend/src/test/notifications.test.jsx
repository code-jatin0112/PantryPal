import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotificationCard from '../components/notifications/NotificationCard';
import NotificationHeader from '../components/notifications/NotificationHeader';
import NotificationFilters from '../components/notifications/NotificationFilters';

const mockNotification = {
  id: 'notif-test-1',
  category: 'expiry',
  title: 'Organic Milk Expiring Soon',
  description: '1 container expires in 2 days.',
  timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  isRead: false,
  priority: 'high',
  actionText: 'View in Pantry',
  actionLink: '/pantry',
};

describe('Notifications Center Test Suite', () => {
  it('renders notification card with category icon, title, priority, and relative time', () => {
    render(
      <BrowserRouter>
        <NotificationCard
          notification={mockNotification}
          onToggleRead={vi.fn()}
          onDelete={vi.fn()}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Organic Milk Expiring Soon')).toBeInTheDocument();
    expect(screen.getByText(/high priority/i)).toBeInTheDocument();
    expect(screen.getByText(/View in Pantry/i)).toBeInTheDocument();
  });

  it('renders header with unread badge and action triggers', () => {
    const handleMarkAll = vi.fn();
    const handleClearAll = vi.fn();

    render(
      <NotificationHeader
        unreadCount={4}
        totalCount={10}
        onMarkAllRead={handleMarkAll}
        onClearAll={handleClearAll}
      />
    );

    expect(screen.getByText(/4 Unread/i)).toBeInTheDocument();

    const markAllBtn = screen.getByRole('button', { name: /Mark All Read/i });
    fireEvent.click(markAllBtn);
    expect(handleMarkAll).toHaveBeenCalled();

    const clearAllBtn = screen.getByRole('button', { name: /Clear All/i });
    fireEvent.click(clearAllBtn);
    expect(handleClearAll).toHaveBeenCalled();
  });

  it('filters tab selection and updates query search term', () => {
    const handleTabChange = vi.fn();
    const handleSearchChange = vi.fn();

    render(
      <NotificationFilters
        activeTab="all"
        onTabChange={handleTabChange}
        searchTerm=""
        onSearchChange={handleSearchChange}
        unreadCount={3}
      />
    );

    const unreadTab = screen.getByRole('button', { name: /Unread/i });
    fireEvent.click(unreadTab);
    expect(handleTabChange).toHaveBeenCalledWith('unread');

    const searchInput = screen.getByPlaceholderText(/Search notifications/i);
    fireEvent.change(searchInput, { target: { value: 'Milk' } });
    expect(handleSearchChange).toHaveBeenCalledWith('Milk');
  });
});
