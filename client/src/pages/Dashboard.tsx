import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  ArrowRight,
  Sparkles,
  Calendar,
  Check,
  Plus,
  ListTodo,
  CheckSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { PriorityBadge } from '../components/ui/Badge.js';
import { WelcomeHero } from '../components/dashboard/WelcomeHero.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';

export function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTaskTab, setActiveTaskTab] = useState<'pending' | 'today'>('pending');

  // Load analytics & live tasks
  const { data: analyticsData } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.get('/analytics'),
  });

  const { data: pendingTasksData } = useQuery({
    queryKey: ['tasks', { filter: 'pending' }],
    queryFn: () => api.get('/tasks?filter=pending&limit=6'),
  });

  const { data: todayTasksData } = useQuery({
    queryKey: ['tasks', { filter: 'today' }],
    queryFn: () => api.get('/tasks?filter=today&limit=6'),
  });

  const { data: overdueTasksData } = useQuery({
    queryKey: ['tasks', { filter: 'overdue' }],
    queryFn: () => api.get('/tasks?filter=overdue&limit=5'),
  });

  const { data: habitsData } = useQuery({
    queryKey: ['habits'],
    queryFn: () => api.get('/habits'),
  });

  const { data: aiPlanData } = useQuery({
    queryKey: ['ai', 'plan-day'],
    queryFn: () => api.post('/ai/plan-day'),
    staleTime: 5 * 60 * 1000,
  });

  const toggleTaskMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/tasks/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const analytics = analyticsData?.data || {
    totalTasksCount: 0,
    completedTasksCount: 0,
    pendingTasksCount: 0,
    inProgressTasksCount: 0,
    overdueTasksCount: 0,
    dueTodayTotal: 0,
    dueTodayCompleted: 0,
    dailyProgress: 0,
    completionRate: 0,
    todayFocusMinutes: 0,
  };

  const pendingTasks = pendingTasksData?.data || [];
  const todayTasks = todayTasksData?.data || [];
  const overdueTasks = overdueTasksData?.data || [];
  const habits = habitsData?.data || [];
  const aiPlan = aiPlanData?.data;

  const activeTasksList = activeTaskTab === 'pending' ? pendingTasks : todayTasks;

  // Personalized Greeting
  const currentHour = new Date().getHours();
  let greeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 17) greeting = 'Good afternoon';
  else if (currentHour >= 17) greeting = 'Good evening';

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {greeting}, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> {todayFormatted}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/ai-planner">
            <Button variant="subtle" size="sm" className="gap-1.5">
              <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              Ask AI Assistant
            </Button>
          </Link>
          <Link to="/focus">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Clock className="w-4 h-4" /> Focus Mode
            </Button>
          </Link>
        </div>
      </div>

      {/* Dedicated Welcome & Onboarding Hero with Background Video and Fallback */}
      <WelcomeHero
        userName={user?.name}
        onQuickAdd={() => window.dispatchEvent(new CustomEvent('open-quick-add'))}
      />

      {/* 6 Key Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Tasks Card */}
        <Link to="/tasks" className="block group">
          <Card className="h-full hover:border-indigo-300 dark:hover:border-indigo-700/50 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Total Tasks
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CheckSquare className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {analytics.totalTasksCount}
                  </span>
                  <span className="text-[11px] text-indigo-600 font-medium">
                    {analytics.completedTasksCount} done
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium group-hover:underline flex items-center justify-between">
                <span>All tasks</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Pending Tasks Card */}
        <Link to="/tasks?filter=pending" className="block group">
          <Card className="h-full hover:border-amber-300 dark:hover:border-amber-700/50 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Pending
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ListTodo className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {analytics.pendingTasksCount}
                  </span>
                  <span className="text-[11px] text-amber-600 font-medium">
                    {analytics.inProgressTasksCount > 0
                      ? `${analytics.inProgressTasksCount} active`
                      : `${analytics.pendingTasksCount} to do`}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-amber-600 dark:text-amber-400 font-medium group-hover:underline flex items-center justify-between">
                <span>View backlog</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Due Today */}
        <Link to="/tasks?filter=today" className="block group">
          <Card className="h-full hover:border-violet-300 dark:hover:border-violet-700/50 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    Due Today
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {analytics.dueTodayTotal}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {analytics.dueTodayCompleted} done
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-violet-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${analytics.dailyProgress}%` }}
                  />
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-violet-600 dark:text-violet-400 font-medium group-hover:underline flex items-center justify-between">
                <span>Today's list</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Overdue */}
        <Link to="/tasks?filter=overdue" className="block group">
          <Card className="h-full hover:border-rose-300 dark:hover:border-rose-700/50 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    Overdue
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {analytics.overdueTasksCount}
                  </span>
                  <span className="text-[11px] text-rose-500 font-medium">
                    {analytics.overdueTasksCount > 0 ? 'Urgent' : 'Clear'}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-rose-600 dark:text-rose-400 font-medium group-hover:underline flex items-center justify-between">
                <span>{analytics.overdueTasksCount > 0 ? 'Review now' : 'All clear'}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Completion Rate */}
        <Link to="/tasks?filter=completed" className="block group">
          <Card className="h-full hover:border-emerald-300 dark:hover:border-emerald-700/50 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Completed
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {analytics.completionRate}%
                  </span>
                  <span className="text-[11px] text-emerald-600 font-medium">
                    {analytics.completedTasksCount} tasks
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${analytics.completionRate}%` }}
                  />
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium group-hover:underline flex items-center justify-between">
                <span>Completed</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Focus Time */}
        <Link to="/focus" className="block group">
          <Card className="h-full hover:border-blue-300 dark:hover:border-blue-700/50 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Focus Time
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {analytics.todayFocusMinutes} <span className="text-xs font-normal text-slate-400">m</span>
                  </span>
                  <span className="text-[11px] text-blue-600 font-medium">Deep Work</span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-blue-600 dark:text-blue-400 font-medium group-hover:underline flex items-center justify-between">
                <span>Start timer</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Grid: Tasks + AI Day Plan Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tasks Due Today / Pending Backlog & Overdue */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overdue Alert banner if any */}
          {overdueTasks.length > 0 && (
            <Card className="border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/10">
              <CardHeader className="py-3 px-5 border-b border-rose-100 dark:border-rose-900/40">
                <CardTitle className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Overdue Tasks ({overdueTasks.length})
                </CardTitle>
                <Link to="/tasks?filter=overdue" className="text-xs text-rose-600 hover:underline">
                  View all
                </Link>
              </CardHeader>
              <div className="divide-y divide-rose-100/60 dark:divide-rose-900/30 px-5">
                {overdueTasks.map((t: any) => (
                  <div key={t.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleTaskMutation.mutate(t.id)}
                        className="w-5 h-5 rounded-md border border-rose-400 flex items-center justify-center hover:bg-rose-100 transition-colors"
                      >
                        {t.status === 'COMPLETED' && <Check className="w-3.5 h-3.5 text-rose-600" />}
                      </button>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{t.title}</p>
                        <p className="text-[11px] text-rose-500">
                          Due {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'earlier'}
                        </p>
                      </div>
                    </div>
                    <PriorityBadge priority={t.priority} />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Interactive Tasks Card with Pending & Due Today Tabs */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTaskTab('pending')}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTaskTab === 'pending'
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850'
                  }`}
                >
                  <ListTodo className="w-3.5 h-3.5" /> Pending Tasks ({analytics.pendingTasksCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTaskTab('today')}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTaskTab === 'today'
                      ? 'bg-violet-100 text-violet-900 dark:bg-violet-950/70 dark:text-violet-200'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" /> Due Today ({analytics.dueTodayTotal})
                </button>
              </div>

              <Link to={activeTaskTab === 'pending' ? '/tasks?filter=pending' : '/tasks?filter=today'}>
                <Button variant="ghost" size="sm" className="text-xs text-violet-600 gap-1">
                  View All ({activeTaskTab === 'pending' ? analytics.pendingTasksCount : analytics.dueTodayTotal}){' '}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {activeTasksList.length === 0 ? (
                <div className="text-center py-8 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {activeTaskTab === 'pending' ? 'All caught up! No pending tasks.' : 'No tasks due today!'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    {activeTaskTab === 'pending'
                      ? 'Enjoy your free time, or use Quick Add (Ctrl+K) to plan your next milestone.'
                      : 'You have no scheduled deadlines today. Review your pending backlog or create new tasks.'}
                  </p>
                  <Link to="/tasks" className="inline-block mt-4">
                    <Button variant="secondary" size="sm">
                      <Plus className="w-3.5 h-3.5 mr-1.5" /> Browse My Tasks
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {activeTasksList.map((t: any) => (
                    <div
                      key={t.id}
                      className="py-3 flex items-center justify-between gap-3 group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 px-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleTaskMutation.mutate(t.id)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                            t.status === 'COMPLETED'
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-300 dark:border-slate-700 hover:border-violet-500'
                          }`}
                        >
                          {t.status === 'COMPLETED' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              t.status === 'COMPLETED'
                                ? 'line-through text-slate-400'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {t.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {t.project && (
                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <span
                                  className="w-2 h-2 rounded-full inline-block"
                                  style={{ backgroundColor: t.project.color }}
                                />
                                {t.project.name}
                              </span>
                            )}
                            {t.dueDate && (
                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                {new Date(t.dueDate).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            )}
                            {t.status === 'IN_PROGRESS' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold">
                                In Progress
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={t.priority} />
                        {t.estimatedMinutes && (
                          <span className="text-[11px] text-slate-400 hidden sm:inline">
                            {t.estimatedMinutes}m
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Habits Snapshot */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" /> Daily Habits
              </CardTitle>
              <Link to="/habits">
                <Button variant="ghost" size="sm" className="text-xs text-violet-600 gap-1">
                  Manage Habits <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {habits.length === 0 ? (
                <p className="text-xs text-slate-400 py-3">No habits created yet. Build routines in Habits.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {habits.slice(0, 4).map((h: any) => (
                    <div
                      key={h.id}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{h.title}</p>
                        <p className="text-[11px] text-slate-400">{h.frequency}</p>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 font-bold text-xs">
                        <Flame className="w-3 h-3 fill-current" /> {h.currentStreak}d
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: AI Assistant Daily Schedule Plan */}
        <div className="space-y-6">
          <Card className="border-violet-200/80 dark:border-violet-900/60 bg-gradient-to-b from-violet-50/50 to-transparent dark:from-violet-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-violet-900 dark:text-violet-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                AI Daily Plan
              </CardTitle>
              <span className="text-[10px] px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300 font-bold uppercase">
                Optimized
              </span>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                {aiPlan?.summary || 'Generating a structured timeline based on your pending tasks and energy windows...'}
              </p>

              {aiPlan?.schedule && aiPlan.schedule.length > 0 ? (
                <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-violet-200 dark:before:bg-violet-900/60">
                  {aiPlan.schedule.slice(0, 4).map((item: any, idx: number) => (
                    <div key={idx} className="relative flex items-start gap-3 pl-7">
                      <div className="absolute left-2.5 top-1.5 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-violet-600 ring-4 ring-white dark:ring-slate-900" />
                      <div className="flex-1 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-semibold text-violet-600 dark:text-violet-400">
                            {item.timeSlot}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {item.durationMinutes}m
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                          {item.taskTitle}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                          {item.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-violet-200 dark:border-violet-900/40 rounded-xl">
                  Add more pending tasks to unlock dynamic schedule blocks!
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-violet-100 dark:border-violet-900/40">
                <Link to="/ai">
                  <Button variant="primary" size="sm" className="w-full text-xs gap-1.5">
                    Open Full AI Assistant <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
