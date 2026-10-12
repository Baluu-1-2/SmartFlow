import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  Calendar,
  Clock,
  Check,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Filter,
  MoveRight,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { PriorityBadge } from '../components/ui/Badge.js';

export function Upcoming() {
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'high' | 'urgent'>('all');

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks', { filter: 'upcoming' }],
    queryFn: () => api.get('/tasks?filter=upcoming&limit=100'),
  });

  const toggleTaskMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/tasks/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, days }: { id: string; days: number }) => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      return api.patch(`/tasks/${id}`, { dueDate: targetDate.toISOString() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const tasks: any[] = tasksData?.data || [];
  const filteredTasks = tasks.filter(t => {
    if (selectedFilter === 'high') return t.priority === 'HIGH' || t.priority === 'URGENT';
    if (selectedFilter === 'urgent') return t.priority === 'URGENT';
    return true;
  });

  // Group tasks by Tomorrow, This Week, Next Week, Later
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const in7Days = new Date(now);
  in7Days.setDate(in7Days.getDate() + 7);

  const tomorrowTasks: any[] = [];
  const thisWeekTasks: any[] = [];
  const laterTasks: any[] = [];

  filteredTasks.forEach(task => {
    if (!task.dueDate) {
      laterTasks.push(task);
      return;
    }
    const d = new Date(task.dueDate);
    const dStr = d.toISOString().split('T')[0];
    if (dStr === tomorrowStr) {
      tomorrowTasks.push(task);
    } else if (d <= in7Days && d > tomorrow) {
      thisWeekTasks.push(task);
    } else {
      laterTasks.push(task);
    }
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Upcoming</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
              {filteredTasks.length} Scheduled
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Anticipate deadlines, balance your weekly workload, and reorganize schedules seamlessly.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Priority Filter */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                selectedFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({tasks.length})
            </button>
            <button
              onClick={() => setSelectedFilter('high')}
              className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                selectedFilter === 'high'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              High Priority
            </button>
          </div>

          <Link to="/calendar">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Full Calendar
            </Button>
          </Link>
        </div>
      </div>

      {/* 3-Column Horizon Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tomorrow</span>
            <CalendarDays className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {tomorrowTasks.length} tasks
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Upcoming immediate deadlines</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-violet-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Next 7 Days</span>
            <Calendar className="w-4 h-4 text-violet-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {thisWeekTasks.length} tasks
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Mid-term project milestones</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-slate-400">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Later Horizon</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {laterTasks.length} tasks
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Long-term scheduled items</p>
        </Card>
      </div>

      {/* Task Groups */}
      <div className="space-y-6">
        {/* Tomorrow Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-indigo-500" /> Tomorrow ({tomorrowTasks.length})
            </h2>
          </div>
          {tomorrowTasks.length === 0 ? (
            <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              No tasks due tomorrow. Great job staying ahead!
            </p>
          ) : (
            <div className="space-y-2">
              {tomorrowTasks.map(task => renderUpcomingTaskItem(task))}
            </div>
          )}
        </div>

        {/* Next 7 Days Section */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-500" /> This Week &amp; Next 7 Days ({thisWeekTasks.length})
          </h2>
          {thisWeekTasks.length === 0 ? (
            <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              No tasks scheduled for the rest of this week.
            </p>
          ) : (
            <div className="space-y-2">
              {thisWeekTasks.map(task => renderUpcomingTaskItem(task))}
            </div>
          )}
        </div>

        {/* Later Section */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" /> Later &amp; Future Milestones ({laterTasks.length})
          </h2>
          {laterTasks.length === 0 ? (
            <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              No future tasks currently recorded.
            </p>
          ) : (
            <div className="space-y-2">
              {laterTasks.map(task => renderUpcomingTaskItem(task))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  function renderUpcomingTaskItem(task: any) {
    const formattedDate = task.dueDate
      ? new Date(task.dueDate).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })
      : 'No Date';

    return (
      <Card
        key={task.id}
        className="border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
      >
        <div className="p-3 sm:p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => toggleTaskMutation.mutate(task.id)}
              className="w-5 h-5 rounded-md border border-slate-300 dark:border-slate-700 hover:border-violet-500 flex items-center justify-center transition-colors shrink-0"
            >
              {task.status === 'COMPLETED' && <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-500" />}
            </button>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                {task.title}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {formattedDate}
                </span>

                <PriorityBadge priority={task.priority} />

                {task.estimatedMinutes && (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {task.estimatedMinutes}m
                  </span>
                )}

                {task.project && (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: task.project.color || '#7c3aed' }}
                    />
                    {task.project.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Reschedule Actions */}
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => rescheduleMutation.mutate({ id: task.id, days: 1 })}
              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-medium transition-colors hidden sm:inline-block"
              title="Reschedule to Tomorrow"
            >
              +1 Day
            </button>
            <button
              onClick={() => rescheduleMutation.mutate({ id: task.id, days: 7 })}
              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-medium transition-colors hidden sm:inline-block"
              title="Reschedule to Next Week"
            >
              +1 Week
            </button>
            <Link to={`/focus?taskId=${task.id}`}>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-slate-400 hover:text-violet-600">
                <Clock className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }
}
