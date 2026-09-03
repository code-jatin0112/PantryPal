import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Button from '../ui/Button';
import { PANTRY_CATEGORIES, PANTRY_UNITS } from '../../constants/api';

const pantryItemSchema = z.object({
  name: z.string().trim().min(1, 'Item name is required').max(100, 'Name must be under 100 characters'),
  quantity: z.number({ invalid_type_error: 'Quantity must be a number' }).positive('Quantity must be greater than 0'),
  unit: z.string().trim().min(1, 'Unit is required'),
  category: z.string().optional(),
  expiryDate: z.string().optional(),
  purchaseDate: z.string().optional(),
  minimumQuantity: z.number().optional(),
  notes: z.string().optional(),
});

const PantryForm = ({
  initialData = null,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = 'Save Item',
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: initialData
      ? {
          name: initialData.name || '',
          quantity: initialData.quantity !== undefined ? initialData.quantity : '',
          unit: initialData.unit || 'pcs',
          category: initialData.category || 'Produce',
          expiryDate: initialData.expiryDate || initialData.expirationDate
            ? (initialData.expiryDate || initialData.expirationDate).split('T')[0]
            : '',
          purchaseDate: initialData.createdAt || initialData.purchaseDate
            ? (initialData.createdAt || initialData.purchaseDate).split('T')[0]
            : new Date().toISOString().split('T')[0],
          minimumQuantity: initialData.minimumQuantity !== undefined ? initialData.minimumQuantity : '',
          notes: initialData.notes || '',
        }
      : {
          name: '',
          quantity: '',
          unit: 'pcs',
          category: 'Produce',
          expiryDate: '',
          purchaseDate: new Date().toISOString().split('T')[0],
          minimumQuantity: 1,
          notes: '',
        },
  });

  const onFormSubmit = (data) => {
    const parsedData = {
      ...data,
      quantity: parseFloat(data.quantity),
      minimumQuantity: data.minimumQuantity ? parseFloat(data.minimumQuantity) : undefined,
    };

    // Zod validation check
    const validation = pantryItemSchema.safeParse(parsedData);
    if (!validation.success) {
      console.error('Validation error:', validation.error);
      return;
    }

    onSubmit(parsedData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 text-left" noValidate>
      {/* Name */}
      <div className="space-y-1.5">
        <label htmlFor="pantry-item-name" className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
          Item Name <span className="text-[var(--color-danger)]">*</span>
        </label>
        <input
          id="pantry-item-name"
          type="text"
          placeholder="e.g. Organic Whole Milk"
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
          <label htmlFor="pantry-item-qty" className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
            Quantity <span className="text-[var(--color-danger)]">*</span>
          </label>
          <input
            id="pantry-item-qty"
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
          <label htmlFor="pantry-item-unit" className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
            Unit <span className="text-[var(--color-danger)]">*</span>
          </label>
          <select
            id="pantry-item-unit"
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

      {/* Category & Min Stock */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="pantry-item-category" className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
            Category
          </label>
          <select
            id="pantry-item-category"
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
          <label htmlFor="pantry-item-min-stock" className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
            Min Stock Alert Threshold
          </label>
          <input
            id="pantry-item-min-stock"
            type="number"
            step="any"
            placeholder="1"
            className="input"
            {...register('minimumQuantity')}
          />
        </div>
      </div>

      {/* Dates: Purchase Date & Expiry Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="pantry-item-purchase-date" className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
            Purchase Date
          </label>
          <input
            id="pantry-item-purchase-date"
            type="date"
            className="input"
            {...register('purchaseDate')}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="pantry-item-expiry-date" className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
            Expiry Date
          </label>
          <input
            id="pantry-item-expiry-date"
            type="date"
            className="input"
            {...register('expiryDate')}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[rgba(138,144,112,0.12)]">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default PantryForm;
