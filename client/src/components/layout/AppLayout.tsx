import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';
import { Header } from './Header.js';
import { MobileNav } from './MobileNav.js';
import { QuickAddModal } from './QuickAddModal.js';
import { useAuth } from '../../context/AuthContext.js';

export function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Global Ctrl+K / Cmd+K listener & custom event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsQuickAddOpen(prev => !prev);
      }
    };
    const handleCustomOpen = () => setIsQuickAddOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-quick-add', handleCustomOpen);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-quick-add', handleCustomOpen);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium tracking-wide">Restoring your session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <Sidebar onQuickAddClick={() => setIsQuickAddOpen(true)} />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onQuickAddClick={() => setIsQuickAddOpen(true)}
          onMobileMenuToggle={() => setIsMobileDrawerOpen(true)}
        />

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          <Outlet />
        </main>

        {/* Mobile Navigation & Drawer */}
        <MobileNav
          isDrawerOpen={isMobileDrawerOpen}
          onCloseDrawer={() => setIsMobileDrawerOpen(false)}
          onQuickAddClick={() => setIsQuickAddOpen(true)}
        />
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />
    </div>
  );
}
