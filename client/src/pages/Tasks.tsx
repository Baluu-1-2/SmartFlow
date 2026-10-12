import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Check,
  Plus,
  Search,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  FolderKanban,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ListFilter,
  Sparkles,
} from 'lucide-react';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import { PriorityBadge } from '../components/ui/Badge.js';
import { Input } from '../components/ui/Input.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';

export function Tasks() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentFilter = searchParams.get('filter') || 'all';
  const currentSearch = searchParams.get('search') || '';
  const currentProjectId = searchParams.get('projectId') || '';
  const currentPriority = searchParams.get('priority') || '';

  const [searchInput, setSearchInput] = useState(currentSearch);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [expandedSubtasks, setExpandedSubtasks] = useState<Record<string, boolean>>({});

  // Form states for creating / editing
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    projectId: '',
    dueDate: '',
    estimatedMinutes: 30,
  });

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Fetch Tasks with filters
  const { data: tasksResponse, isLoading } = useQuery({
    queryKey: ['tasks', { filter: currentFilter, search: currentSearch, projectId: currentProjectId, priority: currentPriority }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (currentFilter) params.set('filter', currentFilter);
      if (currentSearch) params.set('search', currentSearch);
      if (currentProjectId) params.set('projectId', currentProjectId);
      if (currentPriority) params.set('priority', currentPriority);
      return api.get(`/tasks?${params.toString()}`);
    },
  });

  // Fetch Projects for assignment dropdown
  const { data: projectsResponse } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects'),
  });

  const tasks = tasksResponse?.data || [];
  const projects = projectsResponse?.data || [];

  // Mutations
  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/tasks/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setIsCreateModalOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsEditModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setIsDeleteModalOpen(false);
      setSelectedTask(null);
    },
  });

  const addSubtaskMutation = useMutation({
    mutationFn: ({ taskId, title }: { taskId: string; title: string }) =>
      api.post(`/tasks/${taskId}/subtasks`, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNewSubtaskTitle('');
    },
  });

  const toggleSubtaskMutation = useMutation({
    mutationFn: ({ subtaskId, isCompleted }: { subtaskId: string; isCompleted: boolean }) =>
      api.patch(`/tasks/subtasks/${subtaskId}`, { isCompleted }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: (subtaskId: string) => api.delete(`/tasks/subtasks/${subtaskId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'MEDIUM',
      projectId: '',
      dueDate: '',
      estimatedMinutes: 30,
    });
  };

  const handleFilterClick = (filter: string) => {
    const next = new URLSearchParams(searchParams);
    if (filter === 'all') next.delete('filter');
    else next.set('filter', filter);
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchInput.trim()) next.set('search', searchInput.trim());
    else next.delete('search');
    setSearchParams(next);
  };

  const openEdit = (task: any) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      projectId: task.projectId || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '',
      estimatedMinutes: task.estimatedMinutes || 30,
    });
    setIsEditModalOpen(true);
  };

  const toggleSubtasksExpand = (taskId: string) => {
    setExpandedSubtasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const filterTabs = [
    { key: 'all', label: 'All Tasks' },
    { key: 'pending', label: 'Pending' },
    { key: 'today', label: 'Today' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            My Tasks
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your personal backlog, deadlines, and project deliverables
          </p>
        </div>

        <Button
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
          className="gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Task
        </Button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        {/* Filter Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {filterTabs.map(tab => {
            const isActive = currentFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleFilterClick(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Project Filter */}
        <div className="flex items-center gap-2">
          {projects.length > 0 && (
            <select
              value={currentProjectId}
              onChange={e => {
                const next = new URLSearchParams(searchParams);
                if (e.target.value) next.set('projectId', e.target.value);
                else next.delete('projectId');
                setSearchParams(next);
              }}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
            >
              <option value="">All Projects</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          <form onSubmit={handleSearchSubmit} className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500"
            />
          </form>
        </div>
      </div>

      {/* Task List Table / Cards */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <CheckSquare className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No tasks found
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {currentSearch || currentFilter !== 'all'
              ? 'Try adjusting your filters or search keywords.'
              : 'Add your first task to jumpstart your productivity!'}
          </p>
          <Button
            onClick={() => {
              resetForm();
              setIsCreateModalOpen(true);
            }}
            variant="outline"
            size="sm"
            className="mt-4"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add New Task
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {tasks.map((task: any) => {
            const isCompleted = task.status === 'COMPLETED';
            const isSubtasksOpen = expandedSubtasks[task.id];
            const subtaskCount = task.subtasks?.length || 0;
            const completedSubtaskCount = task.subtasks?.filter((s: any) => s.isCompleted).length || 0;

            return (
              <Card
                key={task.id}
                className={`transition-all hover:shadow-sm ${
                  isCompleted ? 'bg-slate-50/50 dark:bg-slate-900/40 opacity-75' : ''
                }`}
              >
                <div className="p-4 flex items-start justify-between gap-4">
                  {/* Left: Checkbox + Title + Metadata */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => toggleMutation.mutate(task.id)}
                      className={`w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-700 hover:border-violet-500 hover:bg-violet-50/50'
                      }`}
                    >
                      {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm font-semibold truncate ${
                            isCompleted ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {task.title}
                        </span>
                        <PriorityBadge priority={task.priority} />
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Meta Chips */}
                      <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400 flex-wrap">
                        {task.project && (
                          <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                            <span
                              className="w-2 h-2 rounded-full inline-block"
                              style={{ backgroundColor: task.project.color }}
                            />
                            {task.project.name}
                          </span>
                        )}

                        {task.dueDate && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}

                        {task.estimatedMinutes && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <Clock className="w-3 h-3" />
                            {task.estimatedMinutes}m
                          </span>
                        )}

                        {subtaskCount > 0 && (
                          <button
                            onClick={() => toggleSubtasksExpand(task.id)}
                            className="text-violet-600 dark:text-violet-400 font-medium hover:underline flex items-center gap-1"
                          >
                            {isSubtasksOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            {completedSubtaskCount}/{subtaskCount} Subtasks
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit, Subtasks, Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleSubtasksExpand(task.id)}
                      title="Manage subtasks"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <ListFilter className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEdit(task)}
                      title="Edit task"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTask(task);
                        setIsDeleteModalOpen(true);
                      }}
                      title="Delete task"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Subtasks Section */}
                {isSubtasksOpen && (
                  <div className="px-5 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/40 space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Subtasks checklist
                    </p>
                    <div className="space-y-1.5">
                      {task.subtasks?.map((st: any) => (
                        <div key={st.id} className="flex items-center justify-between text-xs py-1 group/st">
                          <label className="flex items-center gap-2 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={st.isCompleted}
                              onChange={e =>
                                toggleSubtaskMutation.mutate({
                                  subtaskId: st.id,
                                  isCompleted: e.target.checked,
                                })
                              }
                              className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                            />
                            <span className={st.isCompleted ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}>
                              {st.title}
                            </span>
                          </label>
                          <button
                            onClick={() => deleteSubtaskMutation.mutate(st.id)}
                            className="opacity-0 group-hover/st:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add new subtask inline */}
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        value={newSubtaskTitle}
                        onChange={e => setNewSubtaskTitle(e.target.value)}
                        placeholder="Add a step..."
                        className="text-xs flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newSubtaskTitle.trim()) {
                            e.preventDefault();
                            addSubtaskMutation.mutate({ taskId: task.id, title: newSubtaskTitle.trim() });
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={!newSubtaskTitle.trim()}
                        onClick={() => {
                          if (newSubtaskTitle.trim()) {
                            addSubtaskMutation.mutate({ taskId: task.id, title: newSubtaskTitle.trim() });
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Task"
        maxWidth="lg"
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            createMutation.mutate({
              ...formData,
              dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
              projectId: formData.projectId || null,
            });
          }}
          className="space-y-4 pt-2"
        >
          <Input
            label="Title *"
            required
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Prepare client presentation slides"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add key context, acceptance criteria, or links..."
              className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Project
              </label>
              <select
                value={formData.projectId}
                onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="">No Project</option>
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Est. Minutes
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={formData.estimatedMinutes}
                onChange={e => setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value, 10) || 0 })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Due Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.dueDate}
              onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={createMutation.isPending}>
              Create Task
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Task"
        maxWidth="lg"
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            updateMutation.mutate({
              id: selectedTask.id,
              data: {
                ...formData,
                dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
                projectId: formData.projectId || null,
              },
            });
          }}
          className="space-y-4 pt-2"
        >
          <Input
            label="Title *"
            required
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Project
              </label>
              <select
                value={formData.projectId}
                onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="">No Project</option>
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Est. Minutes
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={formData.estimatedMinutes}
                onChange={e => setFormData({ ...formData, estimatedMinutes: parseInt(e.target.value, 10) || 0 })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Due Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.dueDate}
              onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Task"
        maxWidth="sm"
      >
        <div className="space-y-4 pt-1">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Are you sure you want to delete <strong className="text-slate-900 dark:text-slate-100">"{selectedTask?.title}"</strong>? This will permanently remove the task and any subtasks.
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(selectedTask?.id)}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
