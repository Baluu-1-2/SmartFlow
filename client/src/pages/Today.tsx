import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Check,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { PriorityBadge } from '../components/ui/Badge.js';

export function Today() {
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [newDuration, setNewDuration] = useState<number>(30);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  const todayStr = new Date().toISOString().split('T')[0];

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks', { filter: 'today' }],
    queryFn: () => api.get('/tasks?filter=today&limit=100'),
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.get('/analytics'),
  });

  const toggleTaskMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/tasks/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const toggleSubtaskMutation = useMutation({
    mutationFn: ({ taskId, subtaskId, completed }: { taskId: string; subtaskId: string; completed: boolean }) =>
      api.patch(`/tasks/${taskId}/subtasks/${subtaskId}`, { completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (taskPayload: any) => api.post('/tasks', taskPayload),
    onSuccess: () => {
      setNewTitle('');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const handleQuickAddToday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createTaskMutation.mutate({
      title: newTitle.trim(),
      priority: newPriority,
      dueDate: new Date().toISOString(),
      estimatedMinutes: newDuration,
    });
  };

  const tasks: any[] = tasksData?.data || [];
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
  const activeTasks = tasks.filter(t => t.status !== 'COMPLETED');
  const urgentTasks = activeTasks.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH');
  const regularTasks = activeTasks.filter(t => t.priority !== 'URGENT' && t.priority !== 'HIGH');

  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  const totalMinutes = tasks.reduce((sum, t) => sum + (t.estimatedMinutes || 30), 0);
  const remainingMinutes = activeTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 30), 0);

  const toggleExpand = (id: string) => {
    setExpandedTasks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Today</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-xs font-semibold">
              {todayFormatted}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Focus on your essential tasks scheduled for today. Complete them one by one.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/ai-planner">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-500" /> Plan with AI
            </Button>
          </Link>
          <Link to="/focus">
            <Button variant="primary" size="sm" className="gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Start Focus Session
            </Button>
          </Link>
        </div>
      </div>

      {/* Progress & Duration Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-violet-50 to-indigo-50/30 dark:from-violet-950/20 dark:to-slate-900 border-violet-200/60 dark:border-violet-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Completion Rate
            </span>
            <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
              {completedTasks.length} / {totalTasks} tasks
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{progressPercent}%</span>
          </div>
          <div className="mt-3 w-full bg-violet-200/60 dark:bg-violet-900/40 h-2 rounded-full overflow-hidden">
            <div
              className="bg-violet-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Estimated Work
            </span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {Math.round(remainingMinutes / 60 * 10) / 10}
            </span>
            <span className="text-xs text-slate-400 font-medium">hours remaining</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Total planned: {Math.round(totalMinutes / 60 * 10) / 10} hrs across {totalTasks} tasks
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              High Priority Focus
            </span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {urgentTasks.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">critical items</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            {urgentTasks.length > 0 ? 'Tackle these high-impact tasks first.' : 'No urgent bottlenecks right now!'}
          </p>
        </Card>
      </div>

      {/* Quick Add Form for Today */}
      <Card className="border-violet-200/80 dark:border-violet-900/60 shadow-sm">
        <CardContent className="p-4">
          <form onSubmit={handleQuickAddToday} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Add a new task for Today... (e.g., Review project proposal)"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={newPriority}
                onChange={e => setNewPriority(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-violet-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>

              <select
                value={newDuration}
                onChange={e => setNewDuration(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-violet-500"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1 hr</option>
                <option value={90}>1.5 hrs</option>
              </select>

              <Button type="submit" variant="primary" size="sm" disabled={!newTitle.trim()} className="gap-1.5 shrink-0">
                <Plus className="w-4 h-4" /> Add
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Task Sections */}
      <div className="space-y-6">
        {/* Urgent & High Priority Section */}
        {urgentTasks.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> High Priority Items ({urgentTasks.length})
            </h2>
            <div className="space-y-2">
              {urgentTasks.map(task => renderTaskItem(task))}
            </div>
          </div>
        )}

        {/* Regular Tasks Section */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Scheduled for Today ({regularTasks.length})
          </h2>
          {regularTasks.length === 0 && urgentTasks.length === 0 && completedTasks.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">All caught up for today!</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No tasks are currently scheduled for today. Add one above or plan your day with the AI Assistant.
              </p>
            </Card>
          ) : regularTasks.length === 0 && urgentTasks.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No remaining tasks scheduled for today.</p>
          ) : (
            <div className="space-y-2">
              {regularTasks.map(task => renderTaskItem(task))}
            </div>
          )}
        </div>

        {/* Completed Today Section */}
        {completedTasks.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-200/80 dark:border-slate-800">
            <h2 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Completed Today ({completedTasks.length})
            </h2>
            <div className="space-y-2 opacity-75">
              {completedTasks.map(task => renderTaskItem(task))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function renderTaskItem(task: any) {
    const isExpanded = expandedTasks[task.id];
    const subtasks = task.subtasks || [];
    const completedSubtasks = subtasks.filter((s: any) => s.completed).length;

    return (
      <Card
        key={task.id}
        className={`transition-all hover:shadow-sm ${
          task.status === 'COMPLETED'
            ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60'
            : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        <div className="p-3 sm:p-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <button
              onClick={() => toggleTaskMutation.mutate(task.id)}
              className={`w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                task.status === 'COMPLETED'
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'border-slate-300 dark:border-slate-700 hover:border-violet-500'
              }`}
            >
              {task.status === 'COMPLETED' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>

            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium leading-tight ${
                  task.status === 'COMPLETED'
                    ? 'line-through text-slate-400'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {task.title}
              </p>

              {task.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-2">
                <PriorityBadge priority={task.priority} />

                {task.estimatedMinutes && (
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    <Clock className="w-3 h-3 text-slate-400" /> {task.estimatedMinutes}m
                  </span>
                )}

                {task.project && (
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: task.project.color || '#7c3aed' }}
                    />
                    {task.project.name}
                  </span>
                )}

                {subtasks.length > 0 && (
                  <button
                    onClick={() => toggleExpand(task.id)}
                    className="text-[11px] text-violet-600 dark:text-violet-400 flex items-center gap-1 hover:underline"
                  >
                    <Layers className="w-3 h-3" />
                    <span>{completedSubtasks}/{subtasks.length} subtasks</span>
                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to={`/focus?taskId=${task.id}`}>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1 text-slate-500 hover:text-violet-600">
                <Clock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Focus</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Subtasks Accordion */}
        {isExpanded && subtasks.length > 0 && (
          <div className="px-4 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 space-y-1.5">
            {subtasks.map((st: any) => (
              <div key={st.id} className="flex items-center gap-2.5 text-xs">
                <input
                  type="checkbox"
                  checked={st.completed}
                  onChange={e =>
                    toggleSubtaskMutation.mutate({
                      taskId: task.id,
                      subtaskId: st.id,
                      completed: e.target.checked,
                    })
                  }
                  className="rounded text-violet-600 focus:ring-violet-500"
                />
                <span className={st.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}>
                  {st.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  }
}
