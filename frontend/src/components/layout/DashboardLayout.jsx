import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[var(--color-parchment)] text-[var(--color-dark)] font-sans antialiased">
      {/* ── Skip to Main Content Link (Accessibility) ── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--color-dark)] focus:text-white focus:rounded-xl focus:shadow-elevated focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] font-bold text-xs transition-all"
      >
        Skip to main content
      </a>

      {/* Desktop Fixed Sidebar */}
      <aside
        aria-label="Desktop navigation sidebar"
        className="hidden lg:flex flex-shrink-0 h-screen sticky top-0"
      >
        <Sidebar />
      </aside>

      {/* Mobile & Tablet Drawer Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 lg:hidden bg-[#272A1F]/40 backdrop-blur-xs"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              key="drawer"
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              aria-label="Mobile navigation drawer"
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onOpenSidebar={() => setSidebarOpen(true)} />
        <main
          id="main-content"
          tabIndex="-1"
          role="main"
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden focus:outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
