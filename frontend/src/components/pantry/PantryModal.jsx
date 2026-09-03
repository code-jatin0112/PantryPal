import React from 'react';
import Modal from '../ui/Modal';
import PantryForm from './PantryForm';

const PantryModal = ({
  isOpen,
  onClose,
  initialData = null,
  onSubmit,
  loading = false,
}) => {
  const isEditing = Boolean(initialData);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Ingredient' : 'Add New Ingredient'}
      size="md"
    >
      <PantryForm
        initialData={initialData}
        onSubmit={onSubmit}
        onCancel={onClose}
        loading={loading}
        submitLabel={isEditing ? 'Save Changes' : 'Add Ingredient'}
      />
    </Modal>
  );
};

export default PantryModal;
