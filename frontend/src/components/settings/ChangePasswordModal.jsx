import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Lock, Eye, EyeOff, ShieldCheck, Check } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useToast } from '../../context/ToastContext';

const getPasswordStrength = (pass = '') => {
  if (!pass) return { score: 0, label: 'None', color: 'bg-gray-200' };
  let score = 0;
  if (pass.length >= 8) score += 1;
  if (/[A-Z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;

  if (score === 1) return { score: 25, label: 'Weak', color: 'bg-red-500' };
  if (score === 2) return { score: 50, label: 'Fair', color: 'bg-amber-500' };
  if (score === 3) return { score: 75, label: 'Good', color: 'bg-blue-500' };
  return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
};

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const toast = useToast();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassValue = watch('newPassword');
  const strength = getPasswordStrength(newPassValue);

  const onSubmit = async (data) => {
    // Simulate password change API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    toast('Password changed successfully! 🔒', 'success');
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-left p-1 sm:p-2">
        <div className="flex items-center gap-3 pb-3 border-b border-[rgba(138,144,112,0.12)]">
          <div className="w-10 h-10 rounded-2xl bg-[rgba(138,144,112,0.12)] text-[var(--color-sage)] flex items-center justify-center flex-shrink-0">
            <Lock size={20} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[var(--color-dark)] leading-tight">
              Change Password
            </h2>
            <p className="text-xs text-[var(--color-sage)] font-semibold mt-0.5">
              Ensure your account stays secure with a strong passphrase
            </p>
          </div>
        </div>

        {/* Current Password */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              {...register('currentPassword', {
                required: 'Current password is required',
              })}
              placeholder="••••••••"
              className={`input pr-10 ${errors.currentPassword ? 'border-red-400' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-sage)]"
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-xs text-red-500 font-semibold">{errors.currentPassword.message}</p>
          )}
        </div>

        {/* New Password */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
            New Password
          </label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              {...register('newPassword', {
                required: 'New password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
                pattern: {
                  value: /(?=.*[A-Z])(?=.*[0-9])/,
                  message: 'Must contain at least 1 uppercase letter and 1 number',
                },
              })}
              placeholder="••••••••"
              className={`input pr-10 ${errors.newPassword ? 'border-red-400' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-sage)]"
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-xs text-red-500 font-semibold">{errors.newPassword.message}</p>
          )}

          {/* Strength Bar */}
          {newPassValue && (
            <div className="pt-2 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-[var(--color-sage)]">Strength:</span>
                <span className="text-[var(--color-dark)]">{strength.label}</span>
              </div>
              <div className="h-1.5 w-full bg-[var(--color-parchment)] rounded-full overflow-hidden">
                <div
                  className={`h-full ${strength.color} transition-all duration-300`}
                  style={{ width: `${strength.score}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              {...register('confirmPassword', {
                required: 'Please confirm your new password',
                validate: (val) => val === newPassValue || "Passwords don't match",
              })}
              placeholder="••••••••"
              className={`input pr-10 ${errors.confirmPassword ? 'border-red-400' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-sage)]"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-500 font-semibold">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[rgba(138,144,112,0.12)]">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            Update Password
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;
