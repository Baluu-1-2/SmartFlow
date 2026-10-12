import React, { useState } from 'react';
import {
  Flame,
  Plus,
  Check,
  Edit2,
  Trash2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import { Input } from '../components/ui/Input.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';

export function Habits() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    frequency: 'daily',
    color: '#10b981',
  });

  const { data: habitsResponse, isLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: () => api.get('/habits'),
  });

  const habits = habitsResponse?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/habits', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      setIsCreateOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/habits/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      setIsEditOpen(false);
    },
  });

  const toggleDateMutation = useMutation({
    mutationFn: ({ habitId, date }: { habitId: string; date: string }) =>
      api.post(`/habits/${habitId}/toggle-date`, { date }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/habits/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      frequency: 'daily',
      color: '#10b981',
    });
  };

  const openEdit = (h: any) => {
    setSelectedHabit(h);
    setFormData({
      title: h.title,
      description: h.description || '',
      frequency: h.frequency || 'daily',
      color: h.color || '#10b981',
    });
    setIsEditOpen(true);
  };

  // Generate last 7 days list (today down to 6 days ago)
  const getPast7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push({
        dateStr: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        dayNum: d.getDate(),
        isToday: i === 0,
      });
    }
    return days;
  };

  const past7Days = getPast7Days();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500 fill-orange-500" /> Habits & Routines
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build consistency, track daily streaks, and cultivate winning habits
          </p>
        </div>

        <Button
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
          className="gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Habit
        </Button>
      </div>

      {/* Habit Cards */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading habits...</div>
      ) : habits.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Flame className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No habits configured
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Small daily habits compound into massive achievements. Add a morning routine or fitness goal to start.
          </p>
          <Button
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            variant="outline"
            size="sm"
            className="mt-4"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Start a New Habit
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {habits.map((habit: any) => {
            const completionDates = new Set(habit.completions?.map((c: any) => c.date));

            return (
              <Card key={habit.id} className="p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 hover:shadow-xs transition-shadow">
                {/* Habit Info & Streak */}
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                    style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
                  >
                    <Flame className="w-5 h-5 fill-current" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {habit.title}
                      </h3>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center gap-1">
                        <Flame className="w-3 h-3 fill-current" /> {habit.currentStreak} day streak
                      </span>
                    </div>

                    {habit.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {habit.description}
                      </p>
                    )}

                    <p className="text-[10px] text-slate-400 mt-1">
                      Best streak: {habit.longestStreak} days • {habit.totalCompletions} total completions
                    </p>
                  </div>
                </div>

                {/* 7-Day Interactive Checkoff Grid */}
                <div className="flex items-center gap-2 self-center sm:self-auto">
                  {past7Days.map(day => {
                    const isCompleted = completionDates.has(day.dateStr);

                    return (
                      <div key={day.dateStr} className="flex flex-col items-center gap-1">
                        <span className={`text-[10px] font-semibold ${day.isToday ? 'text-violet-600 font-bold' : 'text-slate-400'}`}>
                          {day.dayName}
                        </span>
                        <button
                          onClick={() =>
                            toggleDateMutation.mutate({
                              habitId: habit.id,
                              date: day.dateStr,
                            })
                          }
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                            isCompleted
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          } ${day.isToday && !isCompleted ? 'ring-2 ring-violet-500/50' : ''}`}
                          title={`Toggle ${day.dateStr}`}
                        >
                          {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : day.dayNum}
                        </button>
                      </div>
                    );
                  })}

                  <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => openEdit(habit)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(habit.id)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Habit Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Habit"
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            createMutation.mutate(formData);
          }}
          className="space-y-4 pt-2"
        >
          <Input
            label="Habit Title *"
            required
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Read for 20 minutes"
          />

          <Input
            label="Description"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g. Expand knowledge before going to sleep"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Frequency
            </label>
            <select
              value={formData.frequency}
              onChange={e => setFormData({ ...formData, frequency: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              <option value="daily">Every day</option>
              <option value="weekdays">Weekdays (Mon - Fri)</option>
              <option value="weekends">Weekends only</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={createMutation.isPending}>
              Create Habit
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Habit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Habit"
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            updateMutation.mutate({ id: selectedHabit.id, data: formData });
          }}
          className="space-y-4 pt-2"
        >
          <Input
            label="Habit Title *"
            required
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
          />

          <Input
            label="Description"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Frequency
            </label>
            <select
              value={formData.frequency}
              onChange={e => setFormData({ ...formData, frequency: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              <option value="daily">Every day</option>
              <option value="weekdays">Weekdays (Mon - Fri)</option>
              <option value="weekends">Weekends only</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
