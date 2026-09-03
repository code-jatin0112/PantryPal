import React from 'react';
import ConfirmDialog from '../ui/ConfirmDialog';

const DeleteItemDialog = ({
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
      title="Delete Shopping Item"
      description={`Are you sure you want to remove "${itemName}" from your shopping list?`}
      confirmLabel="Delete Item"
      cancelLabel="Cancel"
      variant="danger"
    />
  );
};

export default DeleteItemDialog;
