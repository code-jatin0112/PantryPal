import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';

const NotesPanel = ({ recipeId, initialNotes = '', onNotesChange }) => {
  const [notes, setNotes] = useState(initialNotes);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  const handleChange = (e) => {
    const text = e.target.value;
    setNotes(text);
    onNotesChange?.(text);
    setSaved(true);

    const timer = setTimeout(() => {
      setSaved(false);
    }, 1500);

    return () => clearTimeout(timer);
  };

  return (
    <div className="bg-white rounded-2xl border border-[rgba(138,144,112,0.18)] p-5 sm:p-6 shadow-[0_1px_3px_rgba(39,42,31,0.04)] space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[rgba(138,144,112,0.10)] text-[var(--color-sage)] flex items-center justify-center flex-shrink-0">
            <FileText size={15} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[var(--color-dark)] uppercase tracking-wider">
              Chef Notes & Adjustments
            </h3>
            <p className="text-[11px] text-[var(--color-sage)] font-semibold">
              Personal modifications, seasoning tweaks, and cooking observations
            </p>
          </div>
        </div>

        {saved && (
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1 animate-fade-in">
            <CheckCircle2 size={11} />
            <span>Autosaved</span>
          </span>
        )}
      </div>

      <textarea
        rows={3}
        value={notes}
        onChange={handleChange}
        placeholder="e.g. Added an extra pinch of garam masala at step 6; roasted garlic for 2 extra minutes..."
        aria-label="Chef cooking notes"
        className="w-full p-3 bg-[var(--color-parchment)]/60 border border-[rgba(138,144,112,0.18)] rounded-xl text-xs sm:text-sm text-[var(--color-dark)] placeholder-[var(--color-sage)] focus:outline-none focus:border-[var(--color-sage)] focus:ring-2 focus:ring-[rgba(138,144,112,0.15)] transition-all resize-none font-medium"
      />
    </div>
  );
};

export default NotesPanel;
