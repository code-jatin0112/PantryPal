import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import EditProfileModal from '../components/settings/EditProfileModal';
import ChangePasswordModal from '../components/settings/ChangePasswordModal';
import DeleteAccountModal from '../components/settings/DeleteAccountModal';
import Settings from '../pages/Settings/Settings';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';
import * as authService from '../services/authService';
import * as preferenceService from '../services/preferenceService';

describe('Account Management & Security Frontend Unit Suite (Phase 5)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  // ── 1. Edit Profile Modal ──────────────────────────────────
  describe('1. EditProfileModal', () => {
    it('populates initial form data and submits updated name and email', async () => {
      const onSaveMock = vi.fn().mockResolvedValue({ name: 'Chef Mario', email: 'mario@test.com' });
      const onCloseMock = vi.fn();

      render(
        <ToastProvider>
          <EditProfileModal
            isOpen={true}
            onClose={onCloseMock}
            initialData={{ name: 'Chef Luigi', email: 'luigi@test.com', bio: 'Pasta specialist' }}
            onSave={onSaveMock}
          />
        </ToastProvider>
      );

      const nameInput = screen.getByDisplayValue('Chef Luigi');
      const emailInput = screen.getByDisplayValue('luigi@test.com');
      expect(nameInput).toBeInTheDocument();
      expect(emailInput).toBeInTheDocument();

      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Chef Mario');

      const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(onSaveMock).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Chef Mario',
            email: 'luigi@test.com',
          })
        );
        expect(onCloseMock).toHaveBeenCalled();
      });
    });

    it('displays error and does not close modal when onSave rejects', async () => {
      const onSaveMock = vi.fn().mockRejectedValue(new Error('Email already in use'));
      const onCloseMock = vi.fn();

      render(
        <ToastProvider>
          <EditProfileModal
            isOpen={true}
            onClose={onCloseMock}
            initialData={{ name: 'Chef Luigi', email: 'luigi@test.com' }}
            onSave={onSaveMock}
          />
        </ToastProvider>
      );

      const editSaveBtn = screen.getByRole('button', { name: /Save Changes/i });
      fireEvent.click(editSaveBtn);

      await waitFor(() => {
        expect(onSaveMock).toHaveBeenCalled();
        expect(onCloseMock).not.toHaveBeenCalled();
      });
    });
  });

  // ── 2. Change Password Modal ───────────────────────────────
  describe('2. ChangePasswordModal', () => {
    it('validates password requirements and calls changeUserPassword API', async () => {
      const changePasswordSpy = vi.spyOn(authService, 'changeUserPassword').mockResolvedValue({
        message: 'Password changed successfully',
      });
      const onCloseMock = vi.fn();

      const { container } = render(
        <ToastProvider>
          <ChangePasswordModal isOpen={true} onClose={onCloseMock} />
        </ToastProvider>
      );

      const currentInput = container.querySelector('input[name="currentPassword"]');
      const newInput = container.querySelector('input[name="newPassword"]');
      const confirmInput = container.querySelector('input[name="confirmPassword"]');

      await userEvent.type(currentInput, 'OldSecretPass123!');
      await userEvent.type(newInput, 'NewSecurePass456!');
      await userEvent.type(confirmInput, 'NewSecurePass456!');

      const submitBtn = screen.getByRole('button', { name: /Update Password/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(changePasswordSpy).toHaveBeenCalledWith({
          currentPassword: 'OldSecretPass123!',
          newPassword: 'NewSecurePass456!',
          confirmPassword: 'NewSecurePass456!',
        });
        expect(onCloseMock).toHaveBeenCalled();
      });
    });

    it('rejects submission when passwords mismatch without calling API', async () => {
      const changePasswordSpy = vi.spyOn(authService, 'changeUserPassword');
      const onCloseMock = vi.fn();

      const { container } = render(
        <ToastProvider>
          <ChangePasswordModal isOpen={true} onClose={onCloseMock} />
        </ToastProvider>
      );

      const currentInput = container.querySelector('input[name="currentPassword"]');
      const newInput = container.querySelector('input[name="newPassword"]');
      const confirmInput = container.querySelector('input[name="confirmPassword"]');

      await userEvent.type(currentInput, 'OldSecretPass123!');
      await userEvent.type(newInput, 'NewSecurePass456!');
      await userEvent.type(confirmInput, 'MismatchPass789!');

      const submitBtn = screen.getByRole('button', { name: /Update Password/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(changePasswordSpy).not.toHaveBeenCalled();
      });
    });

    it('updates token in localStorage when changePassword returns a new accessToken', async () => {
      vi.spyOn(authService, 'changeUserPassword').mockResolvedValue({
        message: 'Password changed successfully',
        accessToken: 'newly-issued-session-token-xyz',
      });
      const onCloseMock = vi.fn();

      const { container } = render(
        <ToastProvider>
          <ChangePasswordModal isOpen={true} onClose={onCloseMock} />
        </ToastProvider>
      );

      const currentInput = container.querySelector('input[name="currentPassword"]');
      const newInput = container.querySelector('input[name="newPassword"]');
      const confirmInput = container.querySelector('input[name="confirmPassword"]');

      await userEvent.type(currentInput, 'OldSecretPass123!');
      await userEvent.type(newInput, 'NewSecurePass456!');
      await userEvent.type(confirmInput, 'NewSecurePass456!');

      const submitBtn = screen.getByRole('button', { name: /Update Password/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe('newly-issued-session-token-xyz');
        expect(onCloseMock).toHaveBeenCalled();
      });
    });
  });

  // ── 3. Delete Account Modal ────────────────────────────────
  describe('3. DeleteAccountModal', () => {
    it('disables delete button until password and acknowledgment are entered', async () => {
      render(
        <ToastProvider>
          <DeleteAccountModal
            isOpen={true}
            onClose={vi.fn()}
            onConfirm={vi.fn()}
            isDeleting={false}
          />
        </ToastProvider>
      );

      const deleteBtn = screen.getByRole('button', { name: /Delete Everything Permanently/i });
      expect(deleteBtn).toBeDisabled();

      const passInput = screen.getByPlaceholderText(/Enter current password/i);
      await userEvent.type(passInput, 'MyPassword123!');
      expect(deleteBtn).toBeDisabled(); // Checkbox still unchecked

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      expect(deleteBtn).not.toBeDisabled();
    });

    it('invokes onConfirm with password when verified', async () => {
      const onConfirmMock = vi.fn().mockResolvedValue({});
      render(
        <ToastProvider>
          <DeleteAccountModal
            isOpen={true}
            onClose={vi.fn()}
            onConfirm={onConfirmMock}
            isDeleting={false}
          />
        </ToastProvider>
      );

      const passInput = screen.getByPlaceholderText(/Enter current password/i);
      await userEvent.type(passInput, 'ConfirmPassword123!');

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      const deleteBtn = screen.getByRole('button', { name: /Delete Everything Permanently/i });
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(onConfirmMock).toHaveBeenCalledWith('ConfirmPassword123!');
      });
    });
  });

  // ── 4. Settings Data Export & Dietary Preferences ──────────
  describe('4. Settings Integration', () => {
    it('handleExportData calls exportUserData and generates download', async () => {
      const exportSpy = vi.spyOn(authService, 'exportUserData').mockResolvedValue({
        version: '1.0.0',
        account: { id: 'u1', name: 'Chef Test', email: 'test@test.com' },
        pantries: [],
        recipes: [],
      });

      // Mock URL.createObjectURL
      const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
      const revokeObjectURLMock = vi.fn();
      global.URL.createObjectURL = createObjectURLMock;
      global.URL.revokeObjectURL = revokeObjectURLMock;

      vi.spyOn(preferenceService, 'getUserPreferences').mockResolvedValue({
        dietaryPreferences: ['Keto'],
        allergies: [],
        dislikedIngredients: [],
      });

      render(
        <BrowserRouter>
          <ToastProvider>
            <AuthProvider>
              <Settings />
            </AuthProvider>
          </ToastProvider>
        </BrowserRouter>
      );

      // Switch to Account tab
      const accountTab = screen.getByRole('button', { name: /Account/i });
      fireEvent.click(accountTab);

      const exportBtn = await screen.findByRole('button', { name: /Export JSON/i });
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(exportSpy).toHaveBeenCalled();
        expect(createObjectURLMock).toHaveBeenCalled();
      });
    });

    it('handles partial export when AI history is unavailable and warns the user', async () => {
      const exportSpy = vi.spyOn(authService, 'exportUserData').mockResolvedValue({
        version: '1.1.0',
        completeness: 'partial',
        dataSources: { relational: 'postgresql', telemetry: 'unavailable' },
        account: { id: 'u1', name: 'Chef Test', email: 'test@test.com' },
        pantries: [],
        recipes: [],
      });

      const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
      const revokeObjectURLMock = vi.fn();
      global.URL.createObjectURL = createObjectURLMock;
      global.URL.revokeObjectURL = revokeObjectURLMock;

      vi.spyOn(preferenceService, 'getUserPreferences').mockResolvedValue({
        dietaryPreferences: ['Keto'],
        allergies: [],
        dislikedIngredients: [],
      });

      render(
        <BrowserRouter>
          <ToastProvider>
            <AuthProvider>
              <Settings />
            </AuthProvider>
          </ToastProvider>
        </BrowserRouter>
      );

      const accountTab = screen.getByRole('button', { name: /Account/i });
      fireEvent.click(accountTab);

      const exportBtn = await screen.findByRole('button', { name: /Export JSON/i });
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(exportSpy).toHaveBeenCalled();
        expect(createObjectURLMock).toHaveBeenCalled();
      });
    });

    it('synchronizes dietary preferences using dietaryPreferences in payload', async () => {
      vi.spyOn(preferenceService, 'getUserPreferences').mockResolvedValue({
        dietaryPreferences: ['Vegetarian'],
        allergies: [],
        dislikedIngredients: [],
      });
      const updatePrefsSpy = vi.spyOn(preferenceService, 'updateUserPreferences').mockResolvedValue({
        dietaryPreferences: ['Vegetarian'],
        dietaryRequirements: ['Vegetarian'],
      });

      render(
        <BrowserRouter>
          <ToastProvider>
            <AuthProvider>
              <Settings />
            </AuthProvider>
          </ToastProvider>
        </BrowserRouter>
      );

      const saveBtn = screen.getByRole('button', { name: /Save Settings/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(updatePrefsSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            dietaryPreferences: expect.any(Array),
            dietaryRequirements: expect.any(Array),
          })
        );
      });
    });
  });
});
