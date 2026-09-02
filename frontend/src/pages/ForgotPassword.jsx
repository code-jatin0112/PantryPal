import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ChefHat, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => (
  <div className="min-h-screen flex items-center justify-center bg-[var(--color-parchment)] p-6">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-sage)] to-[var(--color-bark)] flex items-center justify-center">
          <ChefHat size={18} className="text-white" />
        </div>
        <span className="text-xl font-extrabold text-[var(--color-dark)]">PantryPal</span>
      </div>

      <div className="card p-8">
        <div className="w-14 h-14 rounded-2xl bg-[var(--color-info-bg)] flex items-center justify-center mb-6">
          <Mail size={24} className="text-[var(--color-info)]" />
        </div>

        <h1 className="text-2xl font-extrabold text-[var(--color-dark)] mb-2">Reset password</h1>
        <p className="text-sm text-[var(--color-sage)] leading-relaxed mb-6">
          Enter your email address and we'll send you instructions to reset your password.
        </p>

        {/* Placeholder form — password reset not yet implemented in backend */}
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reset-email" className="text-sm font-semibold text-[var(--color-dark)]">
              Email address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-sage)] pointer-events-none" />
              <input
                id="reset-email"
                type="email"
                placeholder="chef@example.com"
                className="input pl-11"
                disabled
              />
            </div>
          </div>

          <div className="bg-[var(--color-warning-bg)] border border-[rgba(217,164,65,0.3)] rounded-xl p-4 text-sm text-[var(--color-warning)]">
            🚧 Password reset is coming soon. Please contact support if you need help.
          </div>
        </div>

        <Link
          to="/login"
          className="flex items-center gap-2 text-sm text-[var(--color-sage)] hover:text-[var(--color-bark)] transition-colors font-medium mt-6"
        >
          <ArrowLeft size={15} />
          Back to Sign In
        </Link>
      </div>
    </motion.div>
  </div>
);

export default ForgotPassword;
