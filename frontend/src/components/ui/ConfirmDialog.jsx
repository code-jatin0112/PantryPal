import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2 } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

/**
 * ConfirmDialog — destructive action confirmation
 *
 * Props:
 *  isOpen:       boolean
 *  onClose:      () => void
 *  onConfirm:    () => void | Promise<void>
 *  title:        string
 *  description:  string
 *  confirmLabel: string (default: 'Delete')
 *  cancelLabel:  string (default: 'Cancel')
 *  variant:      'danger' | 'warning'
 *  loading:      boolean
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) => {
  const iconColor = variant === 'danger'
    ? 'text-[var(--color-danger)] bg-[var(--color-danger-bg)]'
    : 'text-[var(--color-warning)] bg-[var(--color-warning-bg)]';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" hideClose>
      <div className="flex flex-col items-center text-center py-2">
        <div className={`w-14 h-14 rounded-2xl ${iconColor} flex items-center justify-center mb-4`}>
          <AlertTriangle size={26} />
        </div>
        <h3 className="text-lg font-bold text-[var(--color-dark)] mb-2">{title}</h3>
        <p className="text-sm text-[var(--color-sage)] leading-relaxed mb-6">{description}</p>
        <div className="flex gap-3 w-full">
          <Button
            variant="secondary"
            fullWidth
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            fullWidth
            onClick={onConfirm}
            loading={loading}
            icon={variant === 'danger' ? Trash2 : undefined}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
