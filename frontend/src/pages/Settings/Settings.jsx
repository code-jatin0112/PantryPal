import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Globe,
  Palette,
  Bell,
  Sparkles,
  Shield,
  UserX,
  Download,
  LogOut,
  Save,
  RotateCcw,
  Check,
  Utensils,
  DollarSign,
  HeartPulse,
} from 'lucide-react';

import SettingsSection from '../../components/settings/SettingsSection';
import ToggleSwitch from '../../components/settings/ToggleSwitch';
import PreferenceCard from '../../components/settings/PreferenceCard';
import ChangePasswordModal from '../../components/settings/ChangePasswordModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const STORAGE_SETTINGS_KEY = 'pantrypal_user_settings';

const DEFAULT_SETTINGS = {
  // General
  language: 'English',
  timezone: 'UTC-05:00 (Eastern Time)',
  dateFormat: 'DD/MM/YYYY',
  units: 'metric', // metric | imperial

  // Appearance
  theme: 'parchment', // parchment | linen | slate
  accentColor: '#8A9070',
  compactMode: false,
  animations: true,

  // Notifications
  emailNotifications: true,
  pushNotifications: true,
  mealReminder: true,
  pantryExpiryReminder: true,
  shoppingReminder: true,
  aiRecommendationReminder: true,

  // AI Preferences
  cookingStyle: 'quick', // quick | gourmet | onepot | mealprep
  budgetPriority: 'medium', // low | medium | high
  healthGoal: 'high_protein', // high_protein | balanced | low_cal | heart_healthy
  preferredCuisines: ['Mediterranean', 'Italian', 'Asian', 'Indian'],
  diets: ['High Protein'],
  allergies: ['Peanuts'],
  dislikedIngredients: ['Cilantro', 'Mushrooms'],

  // Privacy & Security
  twoFactorAuth: false,
  shareAnalytics: false,
};

const SETTINGS_TABS = [
  { id: 'general',       label: 'General',       icon: Globe },
  { id: 'appearance',    label: 'Appearance',    icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'ai',            label: 'AI Preferences',icon: Sparkles },
  { id: 'privacy',       label: 'Privacy',       icon: Shield },
  { id: 'account',       label: 'Account',       icon: UserX },
];

const Settings = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { logout } = useAuth();

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const [activeTab, setActiveTab] = useState('general');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [dislikedInput, setDislikedInput] = useState('');

  // Persist locally
  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
      toast('Kitchen settings saved successfully! ⚙️', 'success');
    } catch {
      toast('Failed to save settings.', 'error');
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_SETTINGS_KEY);
    toast('Settings reset to system defaults.', 'info');
  };

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key, item) => {
    setSettings((prev) => {
      const current = prev[key] || [];
      const updated = current.includes(item)
        ? current.filter((x) => x !== item)
        : [...current, item];
      return { ...prev, [key]: updated };
    });
  };

  const handleAddDisliked = (e) => {
    e.preventDefault();
    const item = dislikedInput.trim();
    if (item && !settings.dislikedIngredients.includes(item)) {
      setSettings((prev) => ({
        ...prev,
        dislikedIngredients: [...prev.dislikedIngredients, item],
      }));
      setDislikedInput('');
    }
  };

  const handleRemoveDisliked = (item) => {
    setSettings((prev) => ({
      ...prev,
      dislikedIngredients: prev.dislikedIngredients.filter((x) => x !== item),
    }));
  };

  // Export User Data
  const handleExportData = () => {
    const exportBundle = {
      exportedAt: new Date().toISOString(),
      appVersion: '1.0.0-production',
      settings,
      profile: JSON.parse(localStorage.getItem('pantrypal_user_profile') || '{}'),
      conversations: JSON.parse(localStorage.getItem('pantrypal_chat_conversations') || '[]'),
    };

    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pantrypal_kitchen_archive_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast('Complete kitchen archive exported! 📦', 'success');
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    localStorage.clear();
    await logout();
    toast('Account and local data deleted.', 'info');
    navigate('/register');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 sm:space-y-8 max-w-5xl mx-auto text-left"
    >
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[rgba(138,144,112,0.12)] text-[var(--color-sage)] flex items-center justify-center">
              <SettingsIcon size={16} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-dark)] tracking-tight">
              Settings & Preferences
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--color-sage)] font-semibold mt-1">
            Customize language, notifications, AI meal intelligence, and appearance
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="secondary"
            size="sm"
            icon={RotateCcw}
            onClick={handleReset}
            className="text-xs font-bold"
          >
            Reset
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Save}
            onClick={handleSave}
            className="text-xs font-bold shadow-xs"
          >
            Save Settings
          </Button>
        </div>
      </div>

      {/* ── Split Layout: Navigation Tabs (Left) & Active Settings Section (Right) ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="md:col-span-4 lg:col-span-3 bg-white p-2 rounded-2xl border border-[rgba(138,144,112,0.18)] shadow-xs space-y-1">
          {SETTINGS_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  isActive
                    ? 'bg-[var(--color-dark)] text-white shadow-xs'
                    : 'text-[var(--color-bark)] hover:bg-[var(--color-parchment)]'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-white' : 'text-[var(--color-sage)]'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Settings Panel */}
        <div className="md:col-span-8 lg:col-span-9 space-y-6">
          <AnimatePresence mode="wait">
            {/* ── 1. General ── */}
            {activeTab === 'general' && (
              <motion.div
                key="general"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <SettingsSection
                  icon={Globe}
                  title="Regional & System Formats"
                  description="Set your primary language, timezone, and preferred date format"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Language */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
                        Language
                      </label>
                      <select
                        value={settings.language}
                        onChange={(e) => updateSetting('language', e.target.value)}
                        className="input text-xs"
                      >
                        <option value="English">English (US / UK)</option>
                        <option value="Spanish">Español (Spanish)</option>
                        <option value="French">Français (French)</option>
                        <option value="German">Deutsch (German)</option>
                        <option value="Hindi">हिन्दी (Hindi)</option>
                      </select>
                    </div>

                    {/* Timezone */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
                        Timezone
                      </label>
                      <select
                        value={settings.timezone}
                        onChange={(e) => updateSetting('timezone', e.target.value)}
                        className="input text-xs"
                      >
                        <option value="UTC-08:00 (Pacific Time)">UTC-08:00 (Pacific Time)</option>
                        <option value="UTC-05:00 (Eastern Time)">UTC-05:00 (Eastern Time)</option>
                        <option value="UTC+00:00 (GMT / London)">UTC+00:00 (GMT / London)</option>
                        <option value="UTC+05:30 (IST / New Delhi)">UTC+05:30 (IST / New Delhi)</option>
                        <option value="UTC+08:00 (SGT / Singapore)">UTC+08:00 (SGT / Singapore)</option>
                      </select>
                    </div>

                    {/* Date Format */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
                        Date Format
                      </label>
                      <select
                        value={settings.dateFormat}
                        onChange={(e) => updateSetting('dateFormat', e.target.value)}
                        className="input text-xs"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2026)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2026)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (2026-12-31)</option>
                      </select>
                    </div>

                    {/* Measurement Units */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
                        Measurement System
                      </label>
                      <select
                        value={settings.units}
                        onChange={(e) => updateSetting('units', e.target.value)}
                        className="input text-xs"
                      >
                        <option value="metric">Metric (Grams, Milliliters, Kilograms)</option>
                        <option value="imperial">Imperial (Ounces, Cups, Pounds, Tablespoons)</option>
                      </select>
                    </div>
                  </div>
                </SettingsSection>
              </motion.div>
            )}

            {/* ── 2. Appearance ── */}
            {activeTab === 'appearance' && (
              <motion.div
                key="appearance"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <SettingsSection
                  icon={Palette}
                  title="Theme & Visual Interface"
                  description="Customize workspace density, theme palette, and micro-animations"
                >
                  {/* Theme Presets */}
                  <div className="space-y-2">
                    <span className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
                      Interface Theme Palette
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div
                        onClick={() => updateSetting('theme', 'parchment')}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          settings.theme === 'parchment'
                            ? 'bg-[var(--color-parchment)] border-[var(--color-sage)] ring-2 ring-[var(--color-sage)]'
                            : 'bg-white border-[rgba(138,144,112,0.18)]'
                        }`}
                      >
                        <div className="h-6 w-full rounded-lg bg-[#FAF8F3] border border-[#8A9070]/30 mb-2" />
                        <h4 className="text-xs font-bold text-[var(--color-dark)]">Natural Parchment</h4>
                        <p className="text-[10px] text-[var(--color-sage)] font-semibold mt-0.5">Signature warm culinary palette</p>
                      </div>

                      <div
                        onClick={() => updateSetting('theme', 'linen')}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          settings.theme === 'linen'
                            ? 'bg-[var(--color-parchment)] border-[var(--color-sage)] ring-2 ring-[var(--color-sage)]'
                            : 'bg-white border-[rgba(138,144,112,0.18)]'
                        }`}
                      >
                        <div className="h-6 w-full rounded-lg bg-[#F5F2EB] border border-[#B8C39A]/40 mb-2" />
                        <h4 className="text-xs font-bold text-[var(--color-dark)]">Warm Linen</h4>
                        <p className="text-[10px] text-[var(--color-sage)] font-semibold mt-0.5">Soft contrast & gentle shadows</p>
                      </div>

                      <div
                        onClick={() => updateSetting('theme', 'slate')}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          settings.theme === 'slate'
                            ? 'bg-[var(--color-parchment)] border-[var(--color-sage)] ring-2 ring-[var(--color-sage)]'
                            : 'bg-white border-[rgba(138,144,112,0.18)]'
                        }`}
                      >
                        <div className="h-6 w-full rounded-lg bg-[#272A1F] border border-gray-600 mb-2" />
                        <h4 className="text-xs font-bold text-[var(--color-dark)]">Midnight Chef</h4>
                        <p className="text-[10px] text-[var(--color-sage)] font-semibold mt-0.5">High contrast dark cooking mode</p>
                      </div>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="divide-y divide-[rgba(138,144,112,0.10)] pt-2">
                    <ToggleSwitch
                      label="Compact Table & Grid Density"
                      description="Reduce card padding and row heights to view more pantry ingredients at once"
                      checked={settings.compactMode}
                      onChange={(val) => updateSetting('compactMode', val)}
                    />
                    <ToggleSwitch
                      label="Smooth UI Micro-Animations"
                      description="Enable fluid step transitions, timer countdowns, and floating notifications"
                      checked={settings.animations}
                      onChange={(val) => updateSetting('animations', val)}
                    />
                  </div>
                </SettingsSection>
              </motion.div>
            )}

            {/* ── 3. Notifications ── */}
            {activeTab === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <SettingsSection
                  icon={Bell}
                  title="Alerts & Kitchen Reminders"
                  description="Configure how PantryPal reminds you of expiring groceries and planned dinners"
                >
                  <div className="divide-y divide-[rgba(138,144,112,0.10)]">
                    <ToggleSwitch
                      label="Email Notifications"
                      description="Receive weekly grocery digests and critical waste reduction reports"
                      checked={settings.emailNotifications}
                      onChange={(val) => updateSetting('emailNotifications', val)}
                    />
                    <ToggleSwitch
                      label="Push Notifications"
                      description="Real-time alerts directly in your browser when kitchen timers or recipes complete"
                      checked={settings.pushNotifications}
                      onChange={(val) => updateSetting('pushNotifications', val)}
                    />
                    <ToggleSwitch
                      label="Pantry Expiry Warning Alerts"
                      description="Notify 2 days before items in your fridge or pantry reach their best-by date"
                      checked={settings.pantryExpiryReminder}
                      onChange={(val) => updateSetting('pantryExpiryReminder', val)}
                    />
                    <ToggleSwitch
                      label="Scheduled Meal Prep Reminders"
                      description="Gentle alerts 45 minutes before planned breakfast, lunch, or dinner cooking times"
                      checked={settings.mealReminder}
                      onChange={(val) => updateSetting('mealReminder', val)}
                    />
                    <ToggleSwitch
                      label="Smart Grocery Shopping List Reminders"
                      description="Remind to restock low ingredients when opening the shopping list module"
                      checked={settings.shoppingReminder}
                      onChange={(val) => updateSetting('shoppingReminder', val)}
                    />
                    <ToggleSwitch
                      label="AI Recipe Recommendations"
                      description="Daily suggestions matched to newly added ingredients in your inventory"
                      checked={settings.aiRecommendationReminder}
                      onChange={(val) => updateSetting('aiRecommendationReminder', val)}
                    />
                  </div>
                </SettingsSection>
              </motion.div>
            )}

            {/* ── 4. AI Preferences ── */}
            {activeTab === 'ai' && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <SettingsSection
                  icon={Sparkles}
                  title="AI Culinary Intelligence Tuning"
                  description="Customize Gemini AI recommendations to respect your dietary goals, cooking style, and budget"
                >
                  {/* Cooking Style */}
                  <div className="space-y-2">
                    <span className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
                      Preferred Cooking Style
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      <PreferenceCard
                        icon={Utensils}
                        title="Quick & Easy"
                        description="Under 30 mins with minimal cookware"
                        isSelected={settings.cookingStyle === 'quick'}
                        onClick={() => updateSetting('cookingStyle', 'quick')}
                      />
                      <PreferenceCard
                        icon={Sparkles}
                        title="Gourmet / Chef"
                        description="Complex layered flavors & authentic techniques"
                        isSelected={settings.cookingStyle === 'gourmet'}
                        onClick={() => updateSetting('cookingStyle', 'gourmet')}
                      />
                      <PreferenceCard
                        icon={Utensils}
                        title="One-Pot Wonder"
                        description="Single skillet or Dutch oven meals"
                        isSelected={settings.cookingStyle === 'onepot'}
                        onClick={() => updateSetting('cookingStyle', 'onepot')}
                      />
                      <PreferenceCard
                        icon={Utensils}
                        title="Batch Meal Prep"
                        description="High-yield portions for the week ahead"
                        isSelected={settings.cookingStyle === 'mealprep'}
                        onClick={() => updateSetting('cookingStyle', 'mealprep')}
                      />
                    </div>
                  </div>

                  {/* Budget & Health Goal */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
                        Budget Priority Target
                      </label>
                      <select
                        value={settings.budgetPriority}
                        onChange={(e) => updateSetting('budgetPriority', e.target.value)}
                        className="input text-xs"
                      >
                        <option value="low">$ Low Budget (Thrifty Pantry Staples)</option>
                        <option value="medium">$$ Balanced Cost</option>
                        <option value="high">$$$ Gourmet / Premium Ingredients</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
                        Primary Health & Nutrition Goal
                      </label>
                      <select
                        value={settings.healthGoal}
                        onChange={(e) => updateSetting('healthGoal', e.target.value)}
                        className="input text-xs"
                      >
                        <option value="high_protein">High Protein (25g+ per portion)</option>
                        <option value="balanced">Balanced Macro Distribution</option>
                        <option value="low_cal">Low Calorie / Weight Management</option>
                        <option value="heart_healthy">Heart Healthy & Low Sodium</option>
                      </select>
                    </div>
                  </div>

                  {/* Diets & Allergies Pills */}
                  <div className="space-y-3 pt-2">
                    <div>
                      <span className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider mb-1.5">
                        Dietary Profiles
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {['Vegetarian', 'Vegan', 'Gluten Free', 'High Protein', 'Low Carb', 'Keto', 'Dairy Free'].map(
                          (diet) => {
                            const isSel = settings.diets.includes(diet);
                            return (
                              <button
                                key={diet}
                                type="button"
                                onClick={() => toggleArrayItem('diets', diet)}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                                  isSel
                                    ? 'bg-[var(--color-dark)] text-white shadow-xs'
                                    : 'bg-[var(--color-parchment)] text-[var(--color-bark)] hover:bg-[rgba(138,144,112,0.2)]'
                                }`}
                              >
                                {diet}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider mb-1.5">
                        Allergies & Exclusions
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {['Peanuts', 'Tree Nuts', 'Shellfish', 'Dairy', 'Eggs', 'Soy', 'Wheat', 'Sesame'].map(
                          (allergy) => {
                            const isSel = settings.allergies.includes(allergy);
                            return (
                              <button
                                key={allergy}
                                type="button"
                                onClick={() => toggleArrayItem('allergies', allergy)}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                                  isSel
                                    ? 'bg-red-600 text-white shadow-xs'
                                    : 'bg-[var(--color-parchment)] text-[var(--color-bark)] hover:bg-[rgba(138,144,112,0.2)]'
                                }`}
                              >
                                {allergy}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {/* Disliked Ingredients Input */}
                    <div className="space-y-2 pt-1">
                      <span className="block text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
                        Disliked Ingredients (AI will avoid)
                      </span>
                      <form onSubmit={handleAddDisliked} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={dislikedInput}
                          onChange={(e) => setDislikedInput(e.target.value)}
                          placeholder="e.g. Cilantro, Eggplant, Anchovies..."
                          className="input py-1.5 text-xs flex-1"
                        />
                        <Button type="submit" variant="secondary" size="sm" className="text-xs font-bold">
                          Add
                        </Button>
                      </form>

                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {settings.dislikedIngredients.map((item) => (
                          <span
                            key={item}
                            className="px-2.5 py-1 rounded-xl bg-[var(--color-parchment)] border border-[rgba(138,144,112,0.2)] text-xs font-bold text-[var(--color-dark)] flex items-center gap-1.5"
                          >
                            <span>{item}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveDisliked(item)}
                              className="text-red-500 hover:text-red-700 font-extrabold"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </SettingsSection>
              </motion.div>
            )}

            {/* ── 5. Privacy ── */}
            {activeTab === 'privacy' && (
              <motion.div
                key="privacy"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <SettingsSection
                  icon={Shield}
                  title="Security & Account Access"
                  description="Protect your culinary account with password policies and security controls"
                >
                  <div className="divide-y divide-[rgba(138,144,112,0.10)]">
                    <ToggleSwitch
                      label="Two-Factor Authentication (2FA)"
                      description="Require an authentication code when signing into your PantryPal chef account"
                      checked={settings.twoFactorAuth}
                      onChange={(val) => updateSetting('twoFactorAuth', val)}
                    />
                    <ToggleSwitch
                      label="Anonymous Kitchen Analytics"
                      description="Share anonymized pantry usage patterns to improve recipe matching algorithms"
                      checked={settings.shareAnalytics}
                      onChange={(val) => updateSetting('shareAnalytics', val)}
                    />
                  </div>

                  <div className="pt-3 border-t border-[rgba(138,144,112,0.10)] flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[var(--color-dark)]">Account Password</h4>
                      <p className="text-[11px] text-[var(--color-sage)] font-medium">Last changed 2 weeks ago</p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsPasswordModalOpen(true)}
                      className="text-xs font-bold"
                    >
                      Update Password
                    </Button>
                  </div>
                </SettingsSection>
              </motion.div>
            )}

            {/* ── 6. Account ── */}
            {activeTab === 'account' && (
              <motion.div
                key="account"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <SettingsSection
                  icon={UserX}
                  title="Data Export & Account Management"
                  description="Download your complete kitchen database or manage account termination"
                >
                  {/* Export Data */}
                  <div className="p-4 rounded-2xl bg-[var(--color-parchment)]/70 border border-[rgba(138,144,112,0.15)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-[var(--color-dark)] flex items-center gap-1.5">
                        <Download size={14} className="text-[var(--color-sage)]" />
                        <span>Export Kitchen Archive</span>
                      </h4>
                      <p className="text-[11px] text-[var(--color-sage)] font-medium mt-0.5">
                        Download all recipes, pantry items, shopping lists, meal plans, and chat transcripts in JSON format
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Download}
                      onClick={handleExportData}
                      className="text-xs font-bold flex-shrink-0"
                    >
                      Export JSON
                    </Button>
                  </div>

                  {/* Danger Zone */}
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-3">
                    <div>
                      <h4 className="text-xs font-extrabold text-red-900 uppercase tracking-wider">
                        Danger Zone
                      </h4>
                      <p className="text-xs text-red-800/90 font-medium mt-0.5 leading-relaxed">
                        Permanently delete your account, saved recipes, and local kitchen inventory. This action cannot be undone.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <Button
                        variant="danger"
                        size="sm"
                        icon={UserX}
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="text-xs font-bold"
                      >
                        Delete Account Permanently
                      </Button>
                    </div>
                  </div>
                </SettingsSection>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Modals ── */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account Permanently?"
        message="Are you sure you want to permanently erase your PantryPal account? All recipes, inventory items, and shopping lists will be wiped immediately."
        confirmText="Yes, Delete My Account"
        confirmVariant="danger"
      />
    </motion.div>
  );
};

export default Settings;
