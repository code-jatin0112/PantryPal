import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Modal — accessible dialog with Framer Motion animation
 *
 * Props:
 *  isOpen:    boolean
 *  onClose:   () => void
 *  title:     string
 *  size:      'sm' | 'md' | 'lg' | 'xl'
 *  footer:    ReactNode
 *  hideClose: boolean
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
  hideClose = false,
  className = '',
}) => {
  const overlayRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isOpen) onClose?.();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const maxWidth = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size];

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(39,42,31,0.45)', backdropFilter: 'blur(6px)' }}
          onClick={handleOverlayClick}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0.2 }}
            className={`relative bg-white w-full ${maxWidth} rounded-2xl shadow-[var(--shadow-modal)] flex flex-col max-h-[90vh] ${className}`}
          >
            {/* Header */}
            {(title || !hideClose) && (
              <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(138,144,112,0.15)] flex-shrink-0">
                {title && (
                  <h2 className="text-lg font-bold text-[var(--color-dark)] leading-tight">
                    {title}
                  </h2>
                )}
                {!hideClose && (
                  <button
                    onClick={onClose}
                    className="ml-auto p-2 rounded-xl text-[var(--color-sage)] hover:text-[var(--color-bark)] hover:bg-[var(--color-parchment)] transition-all"
                    aria-label="Close modal"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-5">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-[rgba(138,144,112,0.15)] flex-shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
