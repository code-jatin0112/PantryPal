import React from 'react';
import ConfirmDialog from '../ui/ConfirmDialog';

const DeleteDialog = ({
  isOpen,
  onClose,
  onConfirm,
  itemName = 'this item',
  loading = false,
}) => {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      loading={loading}
      title="Delete Pantry Item"
      description={`Are you sure you want to delete "${itemName}"? This item will be permanently removed from your pantry.`}
      confirmLabel="Delete Item"
      cancelLabel="Cancel"
      variant="danger"
    />
  );
};

export default DeleteDialog;
