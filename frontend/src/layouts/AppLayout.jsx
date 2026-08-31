import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import MobileSidebar from "../components/layout/MobileSidebar";

export const AppLayout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#272A1F] flex flex-col lg:flex-row antialiased">
      {/* Desktop Fixed/Sticky Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 border-r border-[#D8C6A5]/40 bg-[#FAF8F3] min-h-screen sticky top-0 h-screen overflow-y-auto">
        <Sidebar className="h-full" />
      </aside>

      {/* Mobile Slide-in Drawer */}
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#FAF8F3]">
        {/* Top Navbar */}
        <Navbar
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

