import React, { useRef, useState } from 'react';
import { Camera, Trash2, Upload, User } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const AvatarUploader = ({
  name = 'User',
  initialPhoto = null,
  onPhotoChange,
}) => {
  const [photo, setPhoto] = useState(initialPhoto);
  const fileInputRef = useRef(null);
  const toast = useToast();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast('Please upload an image file (PNG, JPG, WebP).', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast('Image file must be smaller than 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result);
      onPhotoChange?.(reader.result);
      toast('Profile photo updated!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setPhoto(null);
    onPhotoChange?.(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast('Profile photo removed.', 'info');
  };

  const initial = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <div className="flex items-center gap-5">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="avatar-upload-input"
        aria-label="Upload profile photo"
      />

      {/* Avatar Preview Circle */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[var(--color-parchment)] border-2 border-[rgba(138,144,112,0.25)] flex items-center justify-center cursor-pointer overflow-hidden group shadow-sm flex-shrink-0"
      >
        {photo ? (
          <img
            src={photo}
            alt={name}
            className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
          />
        ) : (
          <div className="w-full h-full bg-[var(--color-dark)] text-white text-3xl sm:text-4xl font-black flex items-center justify-center">
            {initial}
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera size={20} />
          <span className="text-[10px] font-bold mt-1">Change</span>
        </div>
      </div>

      {/* Actions & Specs */}
      <div className="space-y-1.5 text-left">
        <h4 className="text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
          Profile Avatar
        </h4>
        <p className="text-xs text-[var(--color-sage)] font-medium">
          Allowed JPG, PNG, or WebP. Max size 2MB.
        </p>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl bg-[var(--color-parchment)] hover:bg-[rgba(138,144,112,0.2)] text-xs font-bold text-[var(--color-dark)] transition-colors flex items-center gap-1.5 border border-[rgba(138,144,112,0.2)]"
          >
            <Upload size={13} />
            <span>Upload Photo</span>
          </button>

          {photo && (
            <button
              type="button"
              onClick={handleRemove}
              aria-label="Remove photo"
              className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 border border-red-200 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvatarUploader;
