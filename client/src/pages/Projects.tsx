import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Edit2,
  Trash2,
  Archive,
  ArrowRight,
  CheckCircle2,
  ListTodo,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import { Input } from '../components/ui/Input.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';

const COLOR_PALETTE = [
  '#7c3aed', // Violet
  '#2563eb', // Blue
  '#059669', // Emerald
  '#d97706', // Amber
  '#dc2626', // Red
  '#db2777', // Pink
  '#0891b2', // Cyan
  '#4f46e5', // Indigo
];

export function Projects() {
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    color: '#7c3aed',
  });

  const { data: projectsResponse, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects'),
  });

  const projects = projectsResponse?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsCreateOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/projects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsEditOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}?deleteTasks=false`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsDeleteOpen(false);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      color: '#7c3aed',
    });
  };

  const openEdit = (proj: any) => {
    setSelectedProject(proj);
    setFormData({
      name: proj.name,
      description: proj.description || '',
      category: proj.category || '',
      color: proj.color || '#7c3aed',
    });
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Projects & Initiatives
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Organize complex goals, track deliverables, and visualize progress
          </p>
        </div>

        <Button
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
          className="gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> New Project
        </Button>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading projects...</div>
      ) : projects.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <FolderKanban className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No projects yet
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Group your related tasks into focused projects to keep your workflow organized.
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
            <Plus className="w-4 h-4 mr-1.5" /> Create Your First Project
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj: any) => (
            <Card
              key={proj.id}
              className="flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
            >
              {/* Top Color Accent Line */}
              <div
                className="h-1.5 w-full"
                style={{ backgroundColor: proj.color || '#7c3aed' }}
              />

              <div className="p-5 flex-1 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: proj.color || '#7c3aed' }}
                      />
                      {proj.name}
                    </h3>
                    {proj.category && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-1 inline-block">
                        {proj.category}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(proj)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProject(proj);
                        setIsDeleteOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {proj.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {proj.description}
                  </p>
                )}

                {/* Progress Bar & Counts */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Completion</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {proj.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${proj.progress}%`,
                        backgroundColor: proj.color || '#7c3aed',
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                    <span>{proj.completedTasks} completed</span>
                    <span>{proj.totalTasks} total tasks</span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Link to filtered tasks */}
              <div className="p-3 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
                <Link
                  to={`/tasks?projectId=${proj.id}`}
                  className="text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1.5"
                >
                  <ListTodo className="w-3.5 h-3.5" /> View Project Tasks →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Project"
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            createMutation.mutate(formData);
          }}
          className="space-y-4 pt-2"
        >
          <Input
            label="Project Name *"
            required
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Mobile App Redesign"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g. Work, Client, Personal"
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Objective and deliverables..."
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Color Theme
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PALETTE.map(color => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    formData.color === color ? 'ring-2 ring-offset-2 ring-violet-500 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={createMutation.isPending}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Project"
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            updateMutation.mutate({ id: selectedProject.id, data: formData });
          }}
          className="space-y-4 pt-2"
        >
          <Input
            label="Project Name *"
            required
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Color Theme
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PALETTE.map(color => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    formData.color === color ? 'ring-2 ring-offset-2 ring-violet-500 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Project"
        maxWidth="sm"
      >
        <div className="space-y-4 pt-1">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Are you sure you want to remove <strong className="text-slate-900 dark:text-slate-100">"{selectedProject?.name}"</strong>?
          </p>
          <p className="text-xs text-emerald-600 font-medium">
            🛡️ Safe Deletion: All tasks in this project will be kept safely in your task backlog and detached rather than deleted.
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(selectedProject?.id)}
            >
              Delete Project
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
