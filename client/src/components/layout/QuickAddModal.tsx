import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Clock, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { PriorityBadge } from '../ui/Badge.js';
import { parseNaturalLanguageTask, ParsedTaskInput } from '../../lib/nlp.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickAddModal({ isOpen, onClose }: QuickAddModalProps) {
  const queryClient = useQueryClient();
  const [rawInput, setRawInput] = useState('');
  const [parsed, setParsed] = useState<ParsedTaskInput>({
    title: '',
    dueDate: null,
    dueDateFormatted: null,
    priority: 'MEDIUM',
    estimatedMinutes: null,
  });

  // Keep parsed state in sync as user types
  useEffect(() => {
    if (rawInput.trim()) {
      setParsed(parseNaturalLanguageTask(rawInput));
    } else {
      setParsed({
        title: '',
        dueDate: null,
        dueDateFormatted: null,
        priority: 'MEDIUM',
        estimatedMinutes: null,
      });
    }
  }, [rawInput]);

  const createTaskMutation = useMutation({
    mutationFn: (data: any) => api.post('/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setRawInput('');
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsed.title.trim()) return;

    createTaskMutation.mutate({
      title: parsed.title.trim(),
      priority: parsed.priority,
      dueDate: parsed.dueDateFormatted ? new Date(parsed.dueDateFormatted).toISOString() : null,
      estimatedMinutes: parsed.estimatedMinutes,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Smart Quick Add"
      description="Type in natural language, e.g. 'Finish math homework tomorrow at 6 PM, high priority'"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="relative">
          <input
            type="text"
            autoFocus
            value={rawInput}
            onChange={e => setRawInput(e.target.value)}
            placeholder="What needs to be done? (e.g., Deploy release on Friday 3pm urgent)"
            className="w-full text-base font-medium px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
          />
        </div>

        {/* Live Parsed Preview & Adjustments */}
        {rawInput.trim() && (
          <div className="p-4 rounded-xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/40 space-y-3">
            <div className="flex items-center justify-between text-xs text-violet-700 dark:text-violet-300 font-semibold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> AI Interpretation
              </span>
              <PriorityBadge priority={parsed.priority} />
            </div>

            {/* Editable Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">
                  Recognized Title:
                </label>
                <input
                  type="text"
                  value={parsed.title}
                  onChange={e => setParsed({ ...parsed, title: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Scheduled Date & Time:
                </label>
                <input
                  type="datetime-local"
                  value={parsed.dueDateFormatted || ''}
                  onChange={e => setParsed({ ...parsed, dueDateFormatted: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">
                  Priority:
                </label>
                <select
                  value={parsed.priority}
                  onChange={e => setParsed({ ...parsed, priority: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Est. Duration (Minutes):
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={parsed.estimatedMinutes || ''}
                  placeholder="e.g. 30"
                  onChange={e => setParsed({ ...parsed, estimatedMinutes: e.target.value ? parseInt(e.target.value, 10) : null })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Confirm fields above before saving.
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!parsed.title.trim() || createTaskMutation.isPending}
              isLoading={createTaskMutation.isPending}
            >
              Save Task
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
