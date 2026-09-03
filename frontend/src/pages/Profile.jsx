import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User, Mail, Calendar, Settings, LogOut, Package,
  ShoppingCart, BookOpen, ChefHat, ArrowRight
} from 'lucide-react';
import Button from '../components/ui/Button';

// ── Stat item ─────────────────────────────────────────────
const ProfileStat = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-parchment)]">
    <div className="w-9 h-9 rounded-xl bg-white border border-[rgba(138,144,112,0.15)] flex items-center justify-center flex-shrink-0">
      <Icon size={16} className="text-[var(--color-sage)]" />
    </div>
    <div>
      <p className="text-lg font-bold text-[var(--color-dark)] leading-tight">{value}</p>
      <p className="text-xs text-[var(--color-sage)]">{label}</p>
    </div>
  </div>
);

// ── Quick link ────────────────────────────────────────────
const QuickLink = ({ to, icon: Icon, label, desc }) => (
  <Link
    to={to}
    className="flex items-center gap-4 p-4 rounded-xl hover:bg-[var(--color-parchment)] transition-colors group"
  >
    <div className="w-10 h-10 rounded-xl bg-[rgba(138,144,112,0.10)] flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--color-sage)] transition-colors">
      <Icon size={18} className="text-[var(--color-sage)] group-hover:text-white transition-colors" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-[var(--color-dark)]">{label}</p>
      <p className="text-xs text-[var(--color-sage)] truncate">{desc}</p>
    </div>
    <ArrowRight size={15} className="text-[var(--color-sage)] group-hover:translate-x-1 transition-transform" />
  </Link>
);

// ── Main Profile Page ─────────────────────────────────────
const Profile = () => {
  const { user, logout } = useAuth();
  const initial = user?.name?.[0]?.toUpperCase() || '?';
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="page-container max-w-2xl space-y-6">
      {/* Header */}
      <h1 className="page-title">Profile</h1>

      {/* Avatar card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--color-olive)] to-[var(--color-sage)] flex items-center justify-center text-white text-3xl font-black shadow-elevated flex-shrink-0">
            {initial}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-extrabold text-[var(--color-dark)] leading-tight">{user?.name}</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <Mail size={13} className="text-[var(--color-sage)]" />
              <p className="text-sm text-[var(--color-sage)]">{user?.email}</p>
            </div>
            {memberSince && (
              <div className="flex items-center gap-1.5 mt-1">
                <Calendar size={13} className="text-[var(--color-sage)]" />
                <p className="text-xs text-[var(--color-sage)]">Member since {memberSince}</p>
              </div>
            )}
          </div>

          {/* Edit button placeholder */}
          <div className="flex-shrink-0">
            <span className="badge badge-success dot">Active</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          <ProfileStat icon={ChefHat}      label="Account Type"   value="Home Cook" />
          <ProfileStat icon={Package}      label="Pantry Status"  value="Active" />
          <ProfileStat icon={BookOpen}     label="Plan"           value="Free" />
        </div>
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card divide-y divide-[rgba(138,144,112,0.10)]"
      >
        <div className="px-6 py-4 border-b border-[rgba(138,144,112,0.10)]">
          <h3 className="text-sm font-bold text-[var(--color-dark)]">Quick navigation</h3>
        </div>
        <QuickLink to="/pantry"        icon={Package}      label="My Pantry"       desc="View and manage your ingredients" />
        <QuickLink to="/recipes"       icon={BookOpen}     label="Recipes"         desc="Browse and generate recipes" />
        <QuickLink to="/shopping-list" icon={ShoppingCart} label="Shopping List"   desc="Manage your grocery list" />
        <QuickLink to="/preferences"   icon={Settings}     label="Preferences"     desc="Dietary needs, defaults & more" />
      </motion.div>

      {/* Account section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-6 space-y-4"
      >
        <h3 className="text-sm font-bold text-[var(--color-dark)]">Account details</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2.5 border-b border-[rgba(138,144,112,0.10)]">
            <div>
              <p className="text-sm font-medium text-[var(--color-dark)]">Display Name</p>
              <p className="text-sm text-[var(--color-sage)]">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-[rgba(138,144,112,0.10)]">
            <div>
              <p className="text-sm font-medium text-[var(--color-dark)]">Email Address</p>
              <p className="text-sm text-[var(--color-sage)]">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <div>
              <p className="text-sm font-medium text-[var(--color-dark)]">Password</p>
              <p className="text-sm text-[var(--color-sage)]">••••••••</p>
            </div>
            <Link
              to="/forgot-password"
              className="text-xs text-[var(--color-sage)] hover:text-[var(--color-bark)] font-medium transition-colors"
            >
              Change
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Danger zone */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card p-6"
      >
        <h3 className="text-sm font-bold text-[var(--color-dark)] mb-4">Session</h3>
        <Button
          variant="danger"
          icon={LogOut}
          onClick={logout}
          className="w-full sm:w-auto"
        >
          Sign Out
        </Button>
        <p className="text-xs text-[var(--color-sage)] mt-3">
          You will be signed out of all devices and redirected to the login page.
        </p>
      </motion.div>
    </div>
  );
};

export default Profile;
