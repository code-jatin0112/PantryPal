import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const ChatLayout = ({
  sidebar,
  children,
  mobileSidebarOpen = false,
  onCloseMobileSidebar,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-[rgba(138,144,112,0.18)] shadow-[0_4px_20px_rgba(39,42,31,0.04)] overflow-hidden flex h-[720px] max-h-[85vh] relative">
      {/* ── Left Desktop Sidebar (Conversation History) ── */}
      <div className="hidden md:block w-72 lg:w-80 border-r border-[rgba(138,144,112,0.15)] bg-[var(--color-parchment)]/30 h-full flex-shrink-0">
        {sidebar}
      </div>

      {/* ── Mobile Sidebar Drawer ── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobileSidebar}
              className="md:hidden absolute inset-0 bg-black/40 z-30"
            />

            {/* Slide-out Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="md:hidden absolute inset-y-0 left-0 w-72 bg-white border-r border-[rgba(138,144,112,0.2)] z-40 flex flex-col shadow-xl"
            >
              <div className="p-3 border-b border-[rgba(138,144,112,0.12)] flex items-center justify-between">
                <span className="text-xs font-extrabold text-[var(--color-dark)] uppercase tracking-wider">
                  Chat History
                </span>
                <button
                  type="button"
                  onClick={onCloseMobileSidebar}
                  aria-label="Close history"
                  className="p-1 text-[var(--color-sage)] hover:text-[var(--color-dark)]"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">{sidebar}</div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Right Main Chat Studio Area ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        {children}
      </div>
    </div>
  );
};

export default ChatLayout;
