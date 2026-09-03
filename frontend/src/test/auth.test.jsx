import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import ProtectedRoute from '../components/ProtectedRoute';

const TestAuthComponent = () => {
  const { user, loading, logout } = useAuth();
  if (loading) return <div>Loading Auth...</div>;
  return (
    <div>
      <span data-testid="auth-status">{user ? 'Logged In' : 'Logged Out'}</span>
      <span data-testid="user-name">{user?.name || 'Guest'}</span>
      <button onClick={logout}>Log Out</button>
    </div>
  );
};

describe('Authentication & Protected Routes Suite', () => {
  it('initializes in logged out state when no token exists', async () => {
    localStorage.clear();
    render(
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <TestAuthComponent />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged Out');
    });
  });

  it('clears token on logout', async () => {
    localStorage.setItem('token', 'mock-token');
    render(
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <TestAuthComponent />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Log Out/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Log Out/i }));
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('redirects unauthenticated users in ProtectedRoute', () => {
    localStorage.clear();
    render(
      <MemoryRouter initialEntries={['/pantry']}>
        <ToastProvider>
          <AuthProvider>
            <ProtectedRoute>
              <div>Protected Pantry Content</div>
            </ProtectedRoute>
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    expect(screen.queryByText('Protected Pantry Content')).not.toBeInTheDocument();
  });
});
