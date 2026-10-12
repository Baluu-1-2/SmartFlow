import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  CheckSquare,
  LayoutDashboard,
  FolderKanban,
  CalendarDays,
  Timer,
  BarChart3,
  Bot,
  Settings,
  Sparkles,
  Bell,
  Clock,
  Calendar,
} from 'lucide-react';
import { useTimer } from '../../context/TimerContext.js';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api.js';

interface SidebarProps {
  onQuickAddClick: () => void;
}

export function Sidebar({ onQuickAddClick }: SidebarProps) {
  const { isRunning, timeLeft, mode } = useTimer();

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects'),
  });

  const { data: tasksData } = useQuery({
    queryKey: ['tasks', { filter: 'today' }],
    queryFn: () => api.get('/tasks?filter=today'),
  });

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications'),
  });

  const projects = projectsData?.data || [];
  const todayTaskCount = tasksData?.meta?.total ?? 0;
  const unreadNotifs = notifData?.data?.unreadCount ?? 0;

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/tasks', label: 'My Tasks', icon: CheckSquare },
    { to: '/today', label: 'Today', icon: Calendar, badge: todayTaskCount > 0 ? todayTaskCount : null },
    { to: '/upcoming', label: 'Upcoming', icon: Clock },
    { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    { to: '/ai-planner', label: 'AI Planner', icon: Bot, isAIPill: true },
    { to: '/focus', label: 'Focus Mode', icon: Timer, isTimerPill: true },
    { to: '/projects', label: 'Projects & Categories', icon: FolderKanban },
    { to: '/analytics', label: 'Productivity Analytics', icon: BarChart3 },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadNotifs > 0 ? unreadNotifs : null },
    { to: '/settings', label: 'Profile & Settings', icon: Settings },
  ];

  const formatTimerMin = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <aside className="w-64 border-r border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md flex flex-col h-screen sticky top-0 shrink-0 select-none hidden md:flex">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-violet-500/25">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base text-slate-900 dark:text-slate-100 leading-none">
              SmartFlow
            </h1>
            <span className="text-[10px] text-slate-400 font-medium tracking-tight">
              AI-Powered Productivity
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div className="space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300 font-semibold">
                    {item.badge}
                  </span>
                )}

                {item.isTimerPill && isRunning && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 font-mono font-semibold animate-pulse">
                    {formatTimerMin(timeLeft)}
                  </span>
                )}

                {item.isAIPill && (
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 font-bold">
                    AI
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Projects Section */}
        {projects.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Projects
              </span>
            </div>
            <div className="space-y-1">
              {projects.slice(0, 6).map((proj: any) => (
                <NavLink
                  key={proj.id}
                  to={`/tasks?projectId=${proj.id}`}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: proj.color || '#7c3aed' }}
                  />
                  <span className="truncate">{proj.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Add Button in Sidebar Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80">
        <button
          onClick={onQuickAddClick}
          className="w-full py-2.5 px-3 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white text-xs font-semibold shadow-sm hover:shadow flex items-center justify-center gap-2 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Quick Add Task (Ctrl+K)
        </button>
      </div>
    </aside>
  );
}
