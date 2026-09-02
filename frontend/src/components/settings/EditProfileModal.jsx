import React from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, FileText, Check } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import AvatarUploader from './AvatarUploader';
import { useToast } from '../../context/ToastContext';

const EditProfileModal = ({
  isOpen,
  onClose,
  initialData = {},
  onSave,
}) => {
  const toast = useToast();
  const [photoUrl, setPhotoUrl] = React.useState(initialData.photoUrl || null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: initialData.name || '',
      email: initialData.email || '',
      bio: initialData.bio || '',
    },
  });

  const onSubmit = async (data) => {
    onSave?.({
      ...data,
      photoUrl,
    });
    toast('Profile updated successfully! ✨', 'success');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-left p-1 sm:p-2">
        <div className="flex items-center gap-3 pb-3 border-b border-[rgba(138,144,112,0.12)]">
          <div className="w-10 h-10 rounded-2xl bg-[rgba(138,144,112,0.12)] text-[var(--color-sage)] flex items-center justify-center flex-shrink-0">
            <User size={20} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[var(--color-dark)] leading-tight">
              Edit Chef Profile
            </h2>
            <p className="text-xs text-[var(--color-sage)] font-semibold mt-0.5">
              Update your public name, photo, and culinary bio
            </p>
          </div>
        </div>

        {/* Avatar Uploader */}
        <AvatarUploader
          name={initialData.name}
          initialPhoto={photoUrl}
          onPhotoChange={setPhotoUrl}
        />

        {/* Name */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
            Full Name
          </label>
          <input
            type="text"
            {...register('name', {
              required: 'Name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' },
            })}
            className={`input ${errors.name ? 'border-red-400' : ''}`}
            placeholder="Chef Name"
          />
          {errors.name && (
            <p className="text-xs text-red-500 font-semibold">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
            Email Address
          </label>
          <input
            type="email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
            className={`input ${errors.email ? 'border-red-400' : ''}`}
            placeholder="chef@pantrypal.app"
          />
          {errors.email && (
            <p className="text-xs text-red-500 font-semibold">{errors.email.message}</p>
          )}
        </div>

        {/* Bio */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
            Culinary Bio & Philosophy
          </label>
          <textarea
            rows={3}
            {...register('bio', {
              maxLength: { value: 300, message: 'Bio must be under 300 characters' },
            })}
            className={`input py-2 resize-none ${errors.bio ? 'border-red-400' : ''}`}
            placeholder="Tell us about your cooking preferences, favorite meals, or family goals..."
          />
          {errors.bio && (
            <p className="text-xs text-red-500 font-semibold">{errors.bio.message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[rgba(138,144,112,0.12)]">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditProfileModal;
