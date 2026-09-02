import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errorHandler';
import { Eye, EyeOff, Mail, Lock, User, ChefHat, ArrowRight, Check } from 'lucide-react';

// ── Password strength checker ─────────────────────────────
const getPasswordStrength = (pw) => {
  if (!pw) return { score: 0, label: '', color: '' };
  const checks = [
    pw.length >= 8,
    /[A-Z]/.test(pw),
    /[0-9]/.test(pw),
    /[^A-Za-z0-9]/.test(pw),
  ];
  const score = checks.filter(Boolean).length;
  if (score <= 1) return { score: 1, label: 'Weak',   color: 'bg-[var(--color-danger)]' };
  if (score === 2) return { score: 2, label: 'Fair',   color: 'bg-[var(--color-warning)]' };
  if (score === 3) return { score: 3, label: 'Good',   color: 'bg-[var(--color-info)]' };
  return             { score: 4, label: 'Strong', color: 'bg-[var(--color-success)]' };
};

const PERKS = [
  'AI recipes from your pantry stock',
  'Expiry & low-stock alerts',
  'Smart shopping list',
  'Weekly meal planner',
];

const Register = () => {
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [passwordVal, setPasswordVal] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setErrorMsg('');
      await registerUser(data.name, data.email, data.password);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Registration failed. Please try again.'));
    }
  };

  const strength = getPasswordStrength(passwordVal);

  return (
    <div className="min-h-screen flex bg-[var(--color-parchment)]">

      {/* ── Left Panel — Branding ── */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 bg-gradient-to-br from-[var(--color-dark)] via-[#2D3122] to-[var(--color-bark)] p-12 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-[var(--color-sage)] opacity-5 -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-[var(--color-olive)] opacity-8 translate-y-1/4 -translate-x-1/4" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-olive)] flex items-center justify-center shadow-lg">
              <ChefHat size={22} className="text-white" />
            </div>
            <span className="text-2xl font-extrabold text-white tracking-tight">PantryPal</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-4xl font-extrabold text-white leading-tight mb-4 tracking-tight">
              Join thousands of<br />smarter cooks
            </h1>
            <p className="text-[var(--color-olive-light)] text-base leading-relaxed">
              Create your account and start managing your kitchen intelligently today.
            </p>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-10 space-y-4"
          >
            {PERKS.map((perk, i) => (
              <motion.li
                key={perk}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                className="flex items-center gap-3 text-sm text-[rgba(255,255,255,0.75)]"
              >
                <div className="w-5 h-5 rounded-full bg-[var(--color-sage)] flex items-center justify-center flex-shrink-0">
                  <Check size={11} className="text-white" strokeWidth={3} />
                </div>
                {perk}
              </motion.li>
            ))}
          </motion.ul>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="relative z-10 text-xs text-[rgba(255,255,255,0.3)]"
        >
          Free forever. No credit card required.
        </motion.p>
      </motion.div>

      {/* ── Right Panel — Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-md py-8"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-bark)] flex items-center justify-center">
              <ChefHat size={18} className="text-white" />
            </div>
            <span className="text-xl font-extrabold text-[var(--color-dark)]">PantryPal</span>
          </div>

          <div className="mb-8">
            <h2 className="page-title">Create your account</h2>
            <p className="page-subtitle mt-1">Start managing your kitchen today — it's free</p>
          </div>

          {/* Error banner */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 bg-[var(--color-danger-bg)] border border-[rgba(217,92,92,0.25)] text-[var(--color-danger)] rounded-xl px-4 py-3 text-sm mb-6"
              role="alert"
            >
              <span className="flex-shrink-0">⚠️</span>
              <span>{errorMsg}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-name" className="text-sm font-semibold text-[var(--color-dark)]">
                Full name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-sage)] pointer-events-none" />
                <input
                  id="reg-name"
                  type="text"
                  autoComplete="name"
                  autoFocus
                  placeholder="Gordon Ramsay"
                  className={`input pl-11 ${errors.name ? 'input-error' : ''}`}
                  {...register('name', {
                    required: 'Name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  })}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-[var(--color-danger)]" role="alert">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-email" className="text-sm font-semibold text-[var(--color-dark)]">
                Email address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-sage)] pointer-events-none" />
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  placeholder="chef@example.com"
                  className={`input pl-11 ${errors.email ? 'input-error' : ''}`}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
                  })}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-[var(--color-danger)]" role="alert">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-password" className="text-sm font-semibold text-[var(--color-dark)]">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-sage)] pointer-events-none" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  className={`input pl-11 pr-11 ${errors.password ? 'input-error' : ''}`}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'At least 8 characters required' },
                    onChange: (e) => setPasswordVal(e.target.value),
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-sage)] hover:text-[var(--color-bark)] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password strength */}
              {passwordVal && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          n <= strength.score ? strength.color : 'bg-[var(--color-gray-200)]'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-[var(--color-sage)]">
                    Strength: <span className="font-semibold">{strength.label}</span>
                  </p>
                </div>
              )}

              {errors.password && (
                <p className="text-xs text-[var(--color-danger)]" role="alert">{errors.password.message}</p>
              )}
            </div>

            {/* Terms */}
            <p className="text-xs text-[var(--color-sage)] leading-relaxed">
              By creating an account you agree to our{' '}
              <span className="text-[var(--color-bark)] font-medium cursor-pointer hover:underline">Terms of Service</span>{' '}
              and{' '}
              <span className="text-[var(--color-bark)] font-medium cursor-pointer hover:underline">Privacy Policy</span>.
            </p>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileTap={{ scale: 0.97 }}
              className="btn btn-primary btn-lg w-full mt-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={17} />
                </>
              )}
            </motion.button>
          </form>

          {/* Sign in link */}
          <div className="flex items-center gap-4 my-7">
            <div className="divider flex-1" />
            <span className="text-xs text-[var(--color-sage)]">Already a member?</span>
            <div className="divider flex-1" />
          </div>

          <Link to="/login" className="btn btn-secondary btn-lg w-full text-center">
            Sign In Instead
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
