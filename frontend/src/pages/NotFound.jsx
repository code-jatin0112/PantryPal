import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChefHat, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-parchment)] p-6 text-center">
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
      className="max-w-md"
    >
      {/* Illustration */}
      <div className="relative mx-auto mb-8 w-32 h-32">
        <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[var(--color-sage)]/15 to-[var(--color-olive)]/20 flex items-center justify-center">
          <ChefHat size={56} className="text-[var(--color-sage)]" />
        </div>
        <div className="absolute -top-3 -right-3 w-10 h-10 bg-[var(--color-warning)] rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-white font-black text-base">?</span>
        </div>
      </div>

      {/* Heading */}
      <h1 className="text-7xl font-black text-[var(--color-dark)] tracking-tight mb-3">404</h1>
      <h2 className="text-xl font-bold text-[var(--color-dark)] mb-3">Page not found</h2>
      <p className="text-sm text-[var(--color-sage)] leading-relaxed mb-8">
        Looks like this recipe doesn't exist in our cookbook. Let's get you back to the kitchen.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/" className="btn btn-primary">
          <Home size={16} />
          Back to Dashboard
        </Link>
        <button
          onClick={() => window.history.back()}
          className="btn btn-secondary"
        >
          <ArrowLeft size={16} />
          Go Back
        </button>
      </div>
    </motion.div>
  </div>
);

export default NotFound;
