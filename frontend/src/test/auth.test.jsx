import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import ProtectedRoute from '../components/ProtectedRoute';
import Login from '../pages/Login';
import * as authService from '../services/authService';
import api from '../services/api';

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

  // ── Pending Deletion Recovery UI Tests ─────────────────────
  describe('Pending Deletion Recovery UI in Login', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
      localStorage.clear();
    });

    it('displays pending-deletion alert banner when login returns ACCOUNT_PENDING_DELETION', async () => {
      vi.spyOn(api, 'post').mockRejectedValueOnce({
        response: {
          status: 403,
          data: {
            error: {
              code: 'ACCOUNT_PENDING_DELETION',
              message: 'This account is scheduled for deletion, but background data cleanup is still pending.',
            },
          },
        },
      });

      render(
        <MemoryRouter>
          <ToastProvider>
            <AuthProvider>
              <Login />
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText(/Email address/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const submitBtn = screen.getByRole('button', { name: /Sign In/i });

      await userEvent.type(emailInput, 'pending-user@pantrypal.app');
      await userEvent.type(passwordInput, 'Password123!');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Account Scheduled for Deletion')).toBeInTheDocument();
        expect(
          screen.getByText(/Normal account access is disabled and cannot be restored\./i)
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /Finalize Account Deletion Now/i })
        ).toBeInTheDocument();
      });
    });

    it('successfully finalizes deletion when user clicks recovery button', async () => {
      vi.spyOn(api, 'post').mockRejectedValueOnce({
        response: {
          status: 403,
          data: {
            error: {
              code: 'ACCOUNT_PENDING_DELETION',
              message: 'This account is scheduled for deletion.',
            },
          },
        },
      });

      const retrySpy = vi.spyOn(authService, 'retryAccountDeletion').mockResolvedValueOnce({
        status: 'COMPLETED',
        message: 'Account deletion finalized successfully. All records permanently purged.',
      });

      render(
        <MemoryRouter>
          <ToastProvider>
            <AuthProvider>
              <Login />
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText(/Email address/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const submitBtn = screen.getByRole('button', { name: /Sign In/i });

      await userEvent.type(emailInput, 'pending-user@pantrypal.app');
      await userEvent.type(passwordInput, 'Password123!');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Finalize Account Deletion Now/i })).toBeInTheDocument();
      });

      const finalizeBtn = screen.getByRole('button', { name: /Finalize Account Deletion Now/i });
      fireEvent.click(finalizeBtn);

      await waitFor(() => {
        expect(retrySpy).toHaveBeenCalledWith({
          email: 'pending-user@pantrypal.app',
          password: 'Password123!',
        });
        expect(
          screen.getByText(/Account deletion finalized successfully\. All records permanently purged\./i)
        ).toBeInTheDocument();
      });
    });

    it('shows actual error message without claiming false success when retry fails (e.g. MongoDB outage)', async () => {
      vi.spyOn(api, 'post').mockRejectedValueOnce({
        response: {
          status: 403,
          data: {
            error: {
              code: 'ACCOUNT_PENDING_DELETION',
              message: 'This account is scheduled for deletion.',
            },
          },
        },
      });

      vi.spyOn(authService, 'retryAccountDeletion').mockRejectedValueOnce({
        response: {
          status: 502,
          data: {
            error: {
              code: 'TELEMETRY_CLEANUP_FAILED',
              message: 'Telemetry cleanup failed during retry. Account remains locked.',
            },
          },
        },
      });

      render(
        <MemoryRouter>
          <ToastProvider>
            <AuthProvider>
              <Login />
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      const emailInput = screen.getByLabelText(/Email address/i);
      const passwordInput = screen.getByLabelText(/^Password$/i);
      const submitBtn = screen.getByRole('button', { name: /Sign In/i });

      await userEvent.type(emailInput, 'pending-user@pantrypal.app');
      await userEvent.type(passwordInput, 'Password123!');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Finalize Account Deletion Now/i })).toBeInTheDocument();
      });

      const finalizeBtn = screen.getByRole('button', { name: /Finalize Account Deletion Now/i });
      fireEvent.click(finalizeBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/Telemetry cleanup failed during retry\. Account remains locked\./i)
        ).toBeInTheDocument();
        // Crucial: False success is NEVER shown
        expect(
          screen.queryByText(/Account deletion finalized successfully/i)
        ).not.toBeInTheDocument();
      });
    });
  });
});
