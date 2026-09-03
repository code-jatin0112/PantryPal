import React from 'react';
import ConfirmDialog from '../ui/ConfirmDialog';

const DeleteMealPlanDialog = ({
  isOpen,
  onClose,
  onConfirm,
  mealPlanName = 'this meal plan',
  loading = false,
}) => {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      loading={loading}
      title="Delete Meal Plan"
      description={`Are you sure you want to delete "${mealPlanName}"? This will remove all scheduled meals and evaluations for this plan.`}
      confirmLabel="Delete Meal Plan"
      cancelLabel="Cancel"
      variant="danger"
    />
  );
};

export default DeleteMealPlanDialog;
