import React, { useState } from 'react';
import { UserX, AlertTriangle, Lock, Eye, EyeOff } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const DeleteAccountModal = ({ isOpen, onClose, onConfirm, isDeleting }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setPassword('');
      setShowPassword(false);
      setConfirmed(false);
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Password is required to verify identity');
      return;
    }
    if (!confirmed) {
      setError('Please acknowledge that this action cannot be undone');
      return;
    }

    try {
      setError('');
      await onConfirm(password);
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.message ||
        'Account deletion failed. Please check your password.';
      setError(msg);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-5 text-left p-1 sm:p-2">
        <div className="flex items-center gap-3 pb-3 border-b border-red-100">
          <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
            <UserX size={20} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-red-950 leading-tight">
              Permanently Delete Account
            </h2>
            <p className="text-xs text-red-700 font-semibold mt-0.5">
              Irreversible action: All recipes, pantries, and meal plans will be wiped.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle size={15} className="text-red-600 flex-shrink-0" />
            <span>Warning: This cannot be reversed</span>
          </div>
          <p className="leading-relaxed text-red-800">
            Deleting your account will immediately delete your user profile, kitchen inventory, recipes, cooking sessions, meal plans, and personalized AI preferences from PostgreSQL.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-100 border border-red-300 text-xs text-red-800 font-semibold">
            {error}
          </div>
        )}

        {/* Identity Re-verification Password Input */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
            Confirm Your Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter current password"
              className="input pr-10 border-red-300 focus:border-red-500"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-sage)]"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Checkbox Acknowledgment */}
        <label className="flex items-start gap-2.5 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => {
              setConfirmed(e.target.checked);
              if (error) setError('');
            }}
            className="mt-0.5 rounded border-red-300 text-red-600 focus:ring-red-500"
          />
          <span className="text-xs text-[var(--color-dark)] font-medium leading-snug">
            I understand that deleting my account is final and all my culinary data will be permanently destroyed.
          </span>
        </label>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[rgba(138,144,112,0.12)]">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            loading={isDeleting}
            disabled={!password || !confirmed}
          >
            Delete Everything Permanently
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DeleteAccountModal;
