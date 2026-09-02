import React from 'react';
import ConfirmDialog from '../ui/ConfirmDialog';

const DeleteRecipeDialog = ({
  isOpen,
  onClose,
  onConfirm,
  recipeTitle = 'this recipe',
  loading = false,
}) => {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      loading={loading}
      title="Delete Recipe"
      description={`Are you sure you want to delete "${recipeTitle}"? This will permanently remove the recipe from your collection.`}
      confirmLabel="Delete Recipe"
      cancelLabel="Cancel"
      variant="danger"
    />
  );
};

export default DeleteRecipeDialog;
