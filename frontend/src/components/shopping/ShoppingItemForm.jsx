import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { PANTRY_CATEGORIES, PANTRY_UNITS } from '../../constants/api';

const shoppingItemSchema = z.object({
  name: z.string().trim().min(1, 'Item name is required').max(100, 'Name must be under 100 characters'),
  quantity: z.number({ invalid_type_error: 'Quantity must be a number' }).positive('Quantity must be greater than 0'),
  unit: z.string().trim().min(1, 'Unit is required'),
  category: z.string().optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
});

const ShoppingItemForm = ({
  isOpen,
  onClose,
  initialData = null,
  onSubmit,
  loading = false,
}) => {
  const isEditing = Boolean(initialData);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: initialData
      ? {
          name: initialData.name || '',
          quantity: initialData.quantity !== undefined ? initialData.quantity : 1,
          unit: initialData.unit || 'pcs',
          category: initialData.category || 'Produce',
          priority: initialData.priority || 'MEDIUM',
        }
      : {
          name: '',
          quantity: 1,
          unit: 'pcs',
          category: 'Produce',
          priority: 'MEDIUM',
        },
  });

  const onFormSubmit = (data) => {
    const parsedData = {
      ...data,
      quantity: parseFloat(data.quantity) || 1,
    };

    const validation = shoppingItemSchema.safeParse(parsedData);
    if (!validation.success) {
      console.error('Validation error:', validation.error);
      return;
    }

    onSubmit(parsedData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Grocery Item' : 'Add to Shopping List'}
      size="md"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 text-left" noValidate>
        {/* Name */}
        <div className="space-y-1.5">
          <label htmlFor="shopping-item-name" className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
            Item Name <span className="text-[var(--color-danger)]">*</span>
          </label>
          <input
            id="shopping-item-name"
            type="text"
            placeholder="e.g. Organic Almond Milk"
            autoFocus
            className={`input ${errors.name ? 'input-error' : ''}`}
            {...register('name', { required: 'Item name is required' })}
          />
          {errors.name && (
            <p className="text-xs font-semibold text-[var(--color-danger)] mt-1">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Quantity & Unit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="shopping-item-qty" className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
              Quantity <span className="text-[var(--color-danger)]">*</span>
            </label>
            <input
              id="shopping-item-qty"
              type="number"
              step="any"
              min="0.01"
              placeholder="1"
              className={`input ${errors.quantity ? 'input-error' : ''}`}
              {...register('quantity', {
                required: 'Quantity is required',
                min: { value: 0.01, message: 'Quantity must be greater than 0' },
              })}
            />
            {errors.quantity && (
              <p className="text-xs font-semibold text-[var(--color-danger)] mt-1">
                {errors.quantity.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="shopping-item-unit" className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
              Unit <span className="text-[var(--color-danger)]">*</span>
            </label>
            <select
              id="shopping-item-unit"
              className="input bg-white cursor-pointer"
              {...register('unit', { required: 'Unit is required' })}
            >
              {PANTRY_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="shopping-item-category" className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
              Category
            </label>
            <select
              id="shopping-item-category"
              className="input bg-white cursor-pointer"
              {...register('category')}
            >
              {PANTRY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="shopping-item-priority" className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
              Priority
            </label>
            <select
              id="shopping-item-priority"
              className="input bg-white cursor-pointer"
              {...register('priority')}
            >
              <option value="HIGH">High Priority (Urgent)</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[rgba(138,144,112,0.12)]">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {isEditing ? 'Save Changes' : 'Add Item'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ShoppingItemForm;
