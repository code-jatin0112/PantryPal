import React from 'react';
import { Mail, Calendar, Edit2, Lock, LogOut, ShieldCheck } from 'lucide-react';
import Button from '../ui/Button';

const ProfileCard = ({
  user,
  profileData = {},
  onEditProfile,
  onChangePassword,
  onLogout,
}) => {
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : '?';
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'March 2026';

  const bio = profileData.bio || 'Home chef passionate about reducing food waste and discovering high-protein recipes.';

  return (
    <div className="bg-white rounded-3xl border border-[rgba(138,144,112,0.18)] p-6 sm:p-8 shadow-[0_2px_12px_rgba(39,42,31,0.04)] space-y-6 text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        {/* Left: Avatar & Info */}
        <div className="flex items-center gap-4 sm:gap-5">
          {profileData.photoUrl ? (
            <img
              src={profileData.photoUrl}
              alt={user?.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-2 border-[rgba(138,144,112,0.25)] shadow-sm flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[var(--color-dark)] text-white text-3xl sm:text-4xl font-black flex items-center justify-center shadow-sm flex-shrink-0">
              {initial}
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-dark)] leading-tight">
                {user?.name || 'Chef'}
              </h2>
              <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <ShieldCheck size={12} />
                <span>Verified Chef</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[var(--color-sage)] font-semibold">
              <Mail size={13} />
              <span>{user?.email || 'chef@pantrypal.app'}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[var(--color-sage)] font-semibold">
              <Calendar size={13} />
              <span>Member since {memberSince}</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto justify-end">
          <Button
            variant="secondary"
            size="sm"
            icon={Edit2}
            onClick={onEditProfile}
            className="text-xs font-bold"
          >
            Edit Profile
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Lock}
            onClick={onChangePassword}
            className="text-xs font-bold"
          >
            Change Password
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={LogOut}
            onClick={onLogout}
            className="text-xs font-bold"
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Bio Box */}
      {bio && (
        <div className="bg-[var(--color-parchment)]/70 p-4 rounded-2xl border border-[rgba(138,144,112,0.12)]">
          <span className="text-[10px] font-bold text-[var(--color-sage)] uppercase tracking-wider block mb-1">
            About Me / Culinary Bio
          </span>
          <p className="text-xs sm:text-sm text-[var(--color-dark)] font-medium leading-relaxed">
            {bio}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfileCard;
