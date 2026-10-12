import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Check,
} from 'lucide-react';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import { Input } from '../components/ui/Input.js';
import { PriorityBadge } from '../components/ui/Badge.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';

type CalendarView = 'month' | 'week' | 'day';

export function Calendar() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');

  // Fetch all tasks with due dates
  const { data: tasksResponse } = useQuery({
    queryKey: ['tasks', { filter: 'all' }],
    queryFn: () => api.get('/tasks?limit=100'),
  });

  const tasks = tasksResponse?.data || [];

  const createTaskMutation = useMutation({
    mutationFn: (data: any) => api.post('/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsTaskModalOpen(false);
      setNewTaskTitle('');
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/tasks/${id}/toggle`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  // Date Navigation Helpers
  const nextPeriod = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (view === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const prevPeriod = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (view === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const resetToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate Month Grid Days
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    const startingDayOfWeek = firstDay.getDay(); // 0 is Sun

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month padding to complete 35 or 42 slots
    const totalSlots = days.length > 35 ? 42 : 35;
    const remaining = totalSlots - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const isToday = (d: Date) => {
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const getTasksForDate = (date: Date) => {
    const targetStr = date.toISOString().split('T')[0];
    return tasks.filter((t: any) => {
      if (!t.dueDate) return false;
      const dStr = new Date(t.dueDate).toISOString().split('T')[0];
      return dStr === targetStr;
    });
  };

  const openAddTaskOnDay = (date: Date) => {
    setSelectedDay(date);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header with Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-violet-600" />
            {currentDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Scheduled deadlines and timeline overview
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggles */}
          <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg flex items-center text-xs font-semibold">
            {(['month', 'week', 'day'] as CalendarView[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-md capitalize transition-colors ${
                  view === v
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={prevPeriod}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <Button variant="outline" size="sm" onClick={resetToToday}>
              Today
            </Button>
            <button
              onClick={nextPeriod}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Month View */}
      {view === 'month' && (
        <Card className="overflow-hidden border border-slate-200/80 dark:border-slate-800">
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Month Day Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800/80">
            {getMonthDays().map((item, idx) => {
              const dayTasks = getTasksForDate(item.date);
              const today = isToday(item.date);

              return (
                <div
                  key={idx}
                  className={`min-h-[110px] sm:min-h-[130px] p-2 flex flex-col justify-between transition-colors group ${
                    !item.isCurrentMonth
                      ? 'bg-slate-50/30 dark:bg-slate-900/30 opacity-40'
                      : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        today
                          ? 'bg-violet-600 text-white shadow-xs'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.date.getDate()}
                    </span>

                    <button
                      onClick={() => openAddTaskOnDay(item.date)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 transition-opacity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Tasks in Day */}
                  <div className="flex-1 space-y-1 overflow-y-auto max-h-[75px]">
                    {dayTasks.map((t: any) => {
                      const isCompleted = t.status === 'COMPLETED';
                      const isOverdue = !isCompleted && new Date(t.dueDate) < new Date();

                      return (
                        <div
                          key={t.id}
                          className={`px-1.5 py-0.5 rounded text-[11px] font-medium truncate flex items-center gap-1 cursor-pointer transition-colors ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 line-through'
                              : isOverdue
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                              : 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300'
                          }`}
                          onClick={() => toggleTaskMutation.mutate(t.id)}
                          title={`${t.title} (Click to toggle complete)`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isCompleted ? 'bg-emerald-500' : isOverdue ? 'bg-rose-500' : 'bg-violet-500'
                            }`}
                          />
                          <span className="truncate">{t.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Week View */}
      {view === 'week' && (
        <Card className="p-6">
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Week Timeline Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {[0, 1, 2, 3, 4, 5, 6].map(offset => {
                const startOfWeek = new Date(currentDate);
                startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + offset);
                const dayTasks = getTasksForDate(startOfWeek);
                const today = isToday(startOfWeek);

                return (
                  <div
                    key={offset}
                    className={`p-3 rounded-xl border ${
                      today
                        ? 'border-violet-500 bg-violet-50/20 dark:bg-violet-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">
                          {startOfWeek.toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {startOfWeek.getDate()}
                        </p>
                      </div>
                      <button
                        onClick={() => openAddTaskOnDay(startOfWeek)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1.5 min-h-[120px]">
                      {dayTasks.map((t: any) => (
                        <div
                          key={t.id}
                          className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-[11px] font-medium"
                        >
                          <p className="truncate font-semibold text-slate-800 dark:text-slate-200">
                            {t.title}
                          </p>
                          <p className="text-[10px] text-slate-400">{t.priority}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Day View */}
      {view === 'day' && (
        <Card className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {currentDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </h2>
              <p className="text-xs text-slate-500">
                {getTasksForDate(currentDate).length} scheduled tasks
              </p>
            </div>
            <Button size="sm" onClick={() => openAddTaskOnDay(currentDate)}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Task for Today
            </Button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 mt-4">
            {getTasksForDate(currentDate).length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">
                No tasks scheduled for this day. Click above to schedule one!
              </p>
            ) : (
              getTasksForDate(currentDate).map((t: any) => (
                <div key={t.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleTaskMutation.mutate(t.id)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                        t.status === 'COMPLETED'
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {t.status === 'COMPLETED' && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          t.status === 'COMPLETED' ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {t.title}
                      </p>
                      <p className="text-[11px] text-slate-500">{t.description}</p>
                    </div>
                  </div>
                  <PriorityBadge priority={t.priority} />
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Quick Add on specific date modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title={`Schedule Task for ${selectedDay?.toLocaleDateString()}`}
        maxWidth="sm"
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            if (!newTaskTitle.trim()) return;
            createTaskMutation.mutate({
              title: newTaskTitle.trim(),
              priority: newTaskPriority,
              dueDate: selectedDay ? selectedDay.toISOString() : null,
            });
          }}
          className="space-y-4 pt-2"
        >
          <Input
            label="Task Title *"
            required
            autoFocus
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            placeholder="e.g. Sprint review meeting"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Priority
            </label>
            <select
              value={newTaskPriority}
              onChange={e => setNewTaskPriority(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={createTaskMutation.isPending}>
              Schedule Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
