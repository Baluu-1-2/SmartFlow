import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Plus,
  CalendarDays,
  Bot,
  X,
  Timer,
  FolderKanban,
  BarChart3,
  Settings,
  Bell,
  Calendar,
  Clock,
} from 'lucide-react';

interface MobileNavProps {
  isDrawerOpen: boolean;
  onCloseDrawer: () => void;
  onQuickAddClick: () => void;
}

export function MobileNav({ isDrawerOpen, onCloseDrawer, onQuickAddClick }: MobileNavProps) {
  const bottomItems = [
    { to: '/', label: 'Home', icon: LayoutDashboard },
    { to: '/tasks', label: 'Tasks', icon: CheckSquare },
    { isAction: true, label: 'Add', icon: Plus, onClick: onQuickAddClick },
    { to: '/today', label: 'Today', icon: Calendar },
    { to: '/ai-planner', label: 'AI', icon: Bot },
  ];

  const drawerLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/tasks', label: 'My Tasks', icon: CheckSquare },
    { to: '/today', label: 'Today', icon: Calendar },
    { to: '/upcoming', label: 'Upcoming', icon: Clock },
    { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    { to: '/ai-planner', label: 'AI Planner', icon: Bot },
    { to: '/focus', label: 'Focus Mode', icon: Timer },
    { to: '/projects', label: 'Projects & Categories', icon: FolderKanban },
    { to: '/analytics', label: 'Productivity Analytics', icon: BarChart3 },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/settings', label: 'Profile & Settings', icon: Settings },
  ];

  return (
    <>
      {/* Fixed Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 px-3 py-2 flex items-center justify-around select-none">
        {bottomItems.map((item, idx) => {
          const Icon = item.icon;
          if (item.isAction) {
            return (
              <button
                key={idx}
                onClick={item.onClick}
                className="w-11 h-11 -mt-5 rounded-full bg-violet-600 text-white shadow-lg shadow-violet-500/40 flex items-center justify-center active:scale-95 transition-transform"
                aria-label="Add task"
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          }

          return (
            <NavLink
              key={idx}
              to={item.to!}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'text-violet-600 dark:text-violet-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Hamburger Navigation Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={onCloseDrawer}
          />
          <div className="relative w-72 max-w-[80vw] bg-white dark:bg-slate-900 h-full shadow-2xl p-5 flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-base text-slate-900 dark:text-slate-100">
                Menu
              </span>
              <button
                onClick={onCloseDrawer}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-1">
              {drawerLinks.map(link => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/'}
                    onClick={onCloseDrawer}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
