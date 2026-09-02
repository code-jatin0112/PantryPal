import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errorHandler';
import { Eye, EyeOff, Mail, Lock, ChefHat, Sparkles, ArrowRight } from 'lucide-react';

// ── Decorative feature list shown on the left panel ──────
const FEATURES = [
  { emoji: '🥕', text: 'Track pantry ingredients & expiry' },
  { emoji: '🤖', text: 'AI recipe suggestions from your stock' },
  { emoji: '🛒', text: 'Smart shopping list management' },
  { emoji: '📅', text: 'Weekly meal planning calendar' },
];

const Login = () => {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setErrorMsg('');
      await login(data.email, data.password);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Invalid email or password.'));
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--color-parchment)]">

      {/* ── Left Panel — Branding ── */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 bg-gradient-to-br from-[var(--color-dark)] via-[#2D3122] to-[var(--color-bark)] p-12 relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[var(--color-sage)] opacity-5 -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-[var(--color-olive)] opacity-8 translate-y-1/4 -translate-x-1/4" />

        {/* Logo */}
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
              Your AI-powered<br />Kitchen Manager
            </h1>
            <p className="text-[var(--color-olive-light)] text-base leading-relaxed">
              Stop wasting food. Cook smarter. Save money with intelligent pantry management.
            </p>
          </motion.div>

          {/* Features list */}
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-10 space-y-4"
          >
            {FEATURES.map(({ emoji, text }, i) => (
              <motion.li
                key={text}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                className="flex items-center gap-3 text-sm text-[rgba(255,255,255,0.75)]"
              >
                <span className="text-lg">{emoji}</span>
                {text}
              </motion.li>
            ))}
          </motion.ul>
        </div>

        {/* Bottom tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="relative z-10 flex items-center gap-2 text-xs text-[rgba(255,255,255,0.35)]"
        >
          <Sparkles size={12} />
          <span>Powered by Google Gemini AI</span>
        </motion.div>
      </motion.div>

      {/* ── Right Panel — Form ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-bark)] flex items-center justify-center">
              <ChefHat size={18} className="text-white" />
            </div>
            <span className="text-xl font-extrabold text-[var(--color-dark)]">PantryPal</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="page-title">Welcome back</h2>
            <p className="page-subtitle mt-1">Sign in to your kitchen dashboard</p>
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

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="text-sm font-semibold text-[var(--color-dark)]">
                Email address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-sage)] pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  autoFocus
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
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-sm font-semibold text-[var(--color-dark)]">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[var(--color-sage)] hover:text-[var(--color-bark)] transition-colors font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-sage)] pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`input pl-11 pr-11 ${errors.password ? 'input-error' : ''}`}
                  {...register('password', { required: 'Password is required' })}
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
              {errors.password && (
                <p className="text-xs text-[var(--color-danger)]" role="alert">{errors.password.message}</p>
              )}
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-[var(--color-sage)] accent-[var(--color-sage)]"
                {...register('rememberMe')}
              />
              <span className="text-sm text-[var(--color-sage)]">Remember me for 30 days</span>
            </label>

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
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={17} />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-7">
            <div className="divider flex-1" />
            <span className="text-xs text-[var(--color-sage)]">New to PantryPal?</span>
            <div className="divider flex-1" />
          </div>

          {/* Register link */}
          <Link
            to="/register"
            className="btn btn-secondary btn-lg w-full text-center"
          >
            Create an account
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
