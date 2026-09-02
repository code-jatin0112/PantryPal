import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { PREFERENCES, DIETARY_OPTIONS, CUISINE_OPTIONS } from '../constants/api';
import { getErrorMessage } from '../utils/errorHandler';
import Spinner from '../components/ui/Spinner';
import { ErrorState } from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import {
  Settings, Leaf, AlertTriangle, Clock, Users, DollarSign,
  Plus, X, Save, RefreshCw
} from 'lucide-react';

// ── Tag chip (dietary, allergy, disliked) ─────────────────
const TagChip = ({ label, onRemove, color = 'neutral' }) => {
  const styles = {
    neutral: 'bg-[rgba(138,144,112,0.12)] text-[var(--color-sage)]',
    danger:  'bg-[var(--color-danger-bg)] text-[var(--color-danger)]',
    warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
  }[color];

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${styles}`}>
      {label}
      <button
        type="button"
        onClick={() => onRemove(label)}
        className="hover:opacity-70 transition-opacity"
        aria-label={`Remove ${label}`}
      >
        <X size={11} />
      </button>
    </span>
  );
};

// ── Tag selector (preset options + custom input) ──────────
const TagSelector = ({ label, icon: Icon, value = [], onChange, presets = [], color }) => {
  const [inputVal, setInputVal] = useState('');

  const add = (tag) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputVal('');
  };

  const remove = (tag) => onChange(value.filter((t) => t !== tag));

  const toggle = (tag) => {
    if (value.includes(tag)) remove(tag);
    else add(tag);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={16} className="text-[var(--color-sage)] flex-shrink-0" />}
        <h3 className="text-sm font-bold text-[var(--color-dark)]">{label}</h3>
      </div>

      {/* Preset options */}
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => toggle(p)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${
                value.includes(p)
                  ? 'bg-[var(--color-sage)] text-white border-[var(--color-sage)]'
                  : 'border-[rgba(138,144,112,0.25)] text-[var(--color-sage)] hover:border-[var(--color-sage)] hover:text-[var(--color-bark)]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Selected tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <TagChip key={tag} label={tag} onRemove={remove} color={color} />
          ))}
        </div>
      )}

      {/* Custom input */}
      <div className="flex gap-2">
        <input
          className="input flex-1 py-2 px-3 text-sm"
          placeholder="Type custom and press Enter..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); add(inputVal); }
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={Plus}
          onClick={() => add(inputVal)}
          disabled={!inputVal.trim()}
        />
      </div>
    </div>
  );
};

// ── Section card ──────────────────────────────────────────
const Section = ({ title, icon: Icon, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="card p-6 space-y-5"
  >
    <div className="flex items-center gap-2 pb-4 border-b border-[rgba(138,144,112,0.12)]">
      <div className="w-8 h-8 rounded-xl bg-[rgba(138,144,112,0.10)] flex items-center justify-center">
        <Icon size={16} className="text-[var(--color-sage)]" />
      </div>
      <h2 className="text-base font-bold text-[var(--color-dark)]">{title}</h2>
    </div>
    {children}
  </motion.div>
);

// ── Main Preferences Page ─────────────────────────────────
const Preferences = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Preference state
  const [dietary, setDietary]     = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [disliked, setDisliked]   = useState([]);
  const [servings, setServings]   = useState(2);
  const [maxTime, setMaxTime]     = useState('');
  const [budget, setBudget]       = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(PREFERENCES.GET);
      const p = res.data.data.preferences;
      setDietary(p.dietaryPreferences || []);
      setAllergies(p.allergies || []);
      setDisliked(p.dislikedIngredients || []);
      setServings(p.defaultServings || 2);
      setMaxTime(p.maxCookingMinutes ?? '');
      setBudget(p.defaultBudget ?? '');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(PREFERENCES.UPDATE, {
        dietaryPreferences: dietary,
        allergies,
        dislikedIngredients: disliked,
        defaultServings: parseInt(servings) || 2,
        maxCookingMinutes: maxTime ? parseInt(maxTime) : null,
        defaultBudget: budget ? parseFloat(budget) : null,
      });
      toast('Preferences saved! 🎉', 'success');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center py-24">
        <Spinner size="lg" center />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="card">
          <ErrorState message={error} onRetry={load} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Preferences</h1>
          <p className="page-subtitle">Personalise your AI recipe suggestions and meal planning</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={load}>
            Reset
          </Button>
          <Button variant="primary" icon={Save} onClick={handleSave} loading={saving}>
            Save Preferences
          </Button>
        </div>
      </div>

      {/* Dietary Preferences */}
      <Section title="Dietary Preferences" icon={Leaf}>
        <TagSelector
          label="Diet types"
          value={dietary}
          onChange={setDietary}
          presets={DIETARY_OPTIONS}
          color="neutral"
        />
      </Section>

      {/* Allergies */}
      <Section title="Allergies & Intolerances" icon={AlertTriangle}>
        <TagSelector
          label="Allergies"
          value={allergies}
          onChange={setAllergies}
          presets={['Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Wheat', 'Soy', 'Fish', 'Shellfish', 'Sesame']}
          color="danger"
        />
      </Section>

      {/* Disliked Ingredients */}
      <Section title="Disliked Ingredients" icon={X}>
        <TagSelector
          label="Ingredients to avoid"
          value={disliked}
          onChange={setDisliked}
          presets={[]}
          color="warning"
        />
      </Section>

      {/* Cooking Defaults */}
      <Section title="Cooking Defaults" icon={Settings}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Default servings */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[var(--color-dark)] flex items-center gap-1.5">
              <Users size={14} className="text-[var(--color-sage)]" />
              Default Servings
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setServings((s) => Math.max(1, s - 1))}
                className="w-9 h-9 rounded-xl border border-[rgba(138,144,112,0.25)] text-[var(--color-sage)] hover:bg-[var(--color-parchment)] transition-colors flex items-center justify-center font-bold text-lg"
              >
                −
              </button>
              <span className="text-2xl font-bold text-[var(--color-dark)] w-8 text-center">{servings}</span>
              <button
                type="button"
                onClick={() => setServings((s) => s + 1)}
                className="w-9 h-9 rounded-xl border border-[rgba(138,144,112,0.25)] text-[var(--color-sage)] hover:bg-[var(--color-parchment)] transition-colors flex items-center justify-center font-bold text-lg"
              >
                +
              </button>
            </div>
            <p className="text-xs text-[var(--color-sage)]">people per meal</p>
          </div>

          {/* Max cooking time */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[var(--color-dark)] flex items-center gap-1.5">
              <Clock size={14} className="text-[var(--color-sage)]" />
              Max Cooking Time
            </label>
            <div className="relative">
              <input
                type="number"
                min="5"
                max="480"
                className="input pr-14"
                placeholder="Any"
                value={maxTime}
                onChange={(e) => setMaxTime(e.target.value)}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--color-sage)]">
                min
              </span>
            </div>
          </div>

          {/* Default budget */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[var(--color-dark)] flex items-center gap-1.5">
              <DollarSign size={14} className="text-[var(--color-sage)]" />
              Default Budget
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[var(--color-sage)]">₹</span>
              <input
                type="number"
                min="0"
                className="input pl-8"
                placeholder="No limit"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Save button (bottom) */}
      <div className="flex justify-end pt-2">
        <Button variant="primary" icon={Save} onClick={handleSave} loading={saving} size="lg">
          Save All Preferences
        </Button>
      </div>
    </div>
  );
};

export default Preferences;
