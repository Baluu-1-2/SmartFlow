import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Calendar,
  ListPlus,
  ArrowRight,
  Check,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Zap,
  Clock,
  Layers,
  CalendarClock,
  RotateCcw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import { PriorityBadge } from '../components/ui/Badge.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';

export function AIPlanner() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'nlp' | 'breakdown' | 'dayplan' | 'reschedule' | 'chat'>('nlp');

  // Natural Language Task Creation state
  const [nlpInput, setNlpInput] = useState('Tomorrow at 3pm, prepare the science project presentation and spend 45 minutes reviewing calculus.');
  const [parsedSuggestions, setParsedSuggestions] = useState<any[]>([]);

  // Selected task for breakdown
  const [breakdownTaskId, setBreakdownTaskId] = useState('');
  const [customBreakdownTitle, setCustomBreakdownTitle] = useState('');

  // Chat state
  const [chatPrompt, setChatPrompt] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    {
      role: 'assistant',
      content:
        'Hello! I am SmartFlow AI Planner. I can convert your thoughts into structured tasks, break down complex milestones, generate daily schedules, and help you reschedule conflicting deadlines. How would you like to plan today?',
    },
  ]);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type: 'plan' | 'breakdown' | 'reschedule' | 'nlp';
    data: any;
  }>({
    isOpen: false,
    title: '',
    description: '',
    type: 'nlp',
    data: null,
  });

  // Fetch pending tasks
  const { data: tasksResponse } = useQuery({
    queryKey: ['tasks', { filter: 'all' }],
    queryFn: () => api.get('/tasks?filter=all&limit=100'),
  });
  const allTasks: any[] = tasksResponse?.data || [];
  const pendingTasks = allTasks.filter(t => t.status !== 'COMPLETED');
  const overdueTasks = allTasks.filter(t => t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) < new Date());

  // Check backend health & AI status
  const { data: healthResponse } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get('/health'),
  });
  const isAIConfigured = Boolean((healthResponse?.data as any)?.aiConfigured ?? (healthResponse as any)?.aiConfigured);

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: (text: string) => api.post('/ai/chat', { prompt: text, conversationId }),
    onSuccess: res => {
      if (res.data) {
        if (!conversationId) setConversationId(res.data.conversationId);
        setMessages(prev => [...prev, { role: 'assistant', content: res.data.message.content }]);
      }
    },
  });

  // Day planning mutation
  const planDayMutation = useMutation({
    mutationFn: () => api.post('/ai/plan-day'),
    onSuccess: res => {
      if (res.data) {
        setConfirmModal({
          isOpen: true,
          title: 'Proposed Daily Schedule Plan',
          description: res.data.summary,
          type: 'plan',
          data: res.data.schedule,
        });
      }
    },
  });

  // Task breakdown mutation
  const breakdownMutation = useMutation({
    mutationFn: (title: string) => api.post('/ai/breakdown', { title }),
    onSuccess: res => {
      if (res.data) {
        setConfirmModal({
          isOpen: true,
          title: `Proposed Breakdown for "${res.data.originalTask}"`,
          description: `Generated ${res.data.subtasks.length} subtasks with total estimated ${res.data.totalEstimatedMinutes} mins.`,
          type: 'breakdown',
          data: res.data,
        });
      }
    },
  });

  // Rescheduling assistance mutation
  const rescheduleMutation = useMutation({
    mutationFn: () => api.post('/ai/reschedule-suggestions'),
    onSuccess: res => {
      if (res.data) {
        setConfirmModal({
          isOpen: true,
          title: 'Smart Rescheduling Suggestions',
          description: res.data.summary || 'Optimized deadlines to prevent overdue bottlenecks.',
          type: 'reschedule',
          data: res.data.suggestions || [],
        });
      }
    },
  });

  // Save parsed NLP tasks to database
  const saveNlpTasksMutation = useMutation({
    mutationFn: async (tasksList: any[]) => {
      for (const t of tasksList) {
        await api.post('/tasks', {
          title: t.title,
          priority: t.priority || 'MEDIUM',
          dueDate: t.dueDate,
          estimatedMinutes: t.estimatedMinutes || 30,
        });
      }
    },
    onSuccess: () => {
      setParsedSuggestions([]);
      setNlpInput('');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  // Save breakdown subtasks to database
  const saveSubtasksMutation = useMutation({
    mutationFn: async ({ taskId, subtasks }: { taskId: string; subtasks: any[] }) => {
      for (const st of subtasks) {
        await api.post(`/tasks/${taskId}/subtasks`, { title: st.title });
      }
    },
    onSuccess: () => {
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Apply rescheduling suggestions
  const applyRescheduleMutation = useMutation({
    mutationFn: async (suggestions: any[]) => {
      for (const s of suggestions) {
        await api.patch(`/tasks/${s.taskId}`, { dueDate: s.proposedDueDate });
      }
    },
    onSuccess: () => {
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  // Client-side NLP parsing with server fallback
  const handleParseNlp = () => {
    if (!nlpInput.trim()) return;

    // Simple heuristic parser for instant response + server AI
    const lines = nlpInput.split(/\band\b|\.|\n/i).map(s => s.trim()).filter(Boolean);
    const parsed = lines.map(line => {
      let priority = 'MEDIUM';
      if (/urgent|asap|critical|immediately/i.test(line)) priority = 'URGENT';
      else if (/high|important|crucial/i.test(line)) priority = 'HIGH';
      else if (/low|someday|maybe/i.test(line)) priority = 'LOW';

      let duration = 30;
      const minMatch = line.match(/(\d+)\s*(?:minutes|mins|min)/i);
      if (minMatch) duration = parseInt(minMatch[1], 10);
      const hrMatch = line.match(/(\d+)\s*(?:hours|hour|hr|hrs)/i);
      if (hrMatch) duration = parseInt(hrMatch[1], 10) * 60;

      let dueDate = new Date();
      if (/tomorrow/i.test(line)) {
        dueDate.setDate(dueDate.getDate() + 1);
      } else if (/next week/i.test(line)) {
        dueDate.setDate(dueDate.getDate() + 7);
      }

      // Clean title
      const cleanTitle = line
        .replace(/\b(?:tomorrow|today|next week|at\s+\d+(?:am|pm)?|spend\s+\d+\s*(?:minutes|mins|hours)?|for\s+\d+\s*(?:minutes|mins))\b/gi, '')
        .trim();

      return {
        title: cleanTitle.length > 3 ? cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1) : line,
        priority,
        dueDate: dueDate.toISOString(),
        estimatedMinutes: duration,
      };
    });

    setParsedSuggestions(parsed);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatPrompt.trim()) return;
    const msg = chatPrompt.trim();
    setChatPrompt('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    chatMutation.mutate(msg);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              AI Smart Planner
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                isAIConfigured
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              {isAIConfigured ? 'Gemini AI Active' : 'Smart Heuristics Engine Active'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Turn natural language thoughts into structured tasks, breakdown complex projects, and schedule your day with AI.
          </p>
        </div>
      </div>

      {/* Feature Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('nlp')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeTab === 'nlp'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Zap className="w-3.5 h-3.5" /> Natural Language Tasks
        </button>
        <button
          onClick={() => setActiveTab('breakdown')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeTab === 'breakdown'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Task Breakdown
        </button>
        <button
          onClick={() => setActiveTab('dayplan')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeTab === 'dayplan'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CalendarClock className="w-3.5 h-3.5" /> Daily Planner
        </button>
        <button
          onClick={() => setActiveTab('reschedule')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeTab === 'reschedule'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reschedule Assistant
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            activeTab === 'chat'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Bot className="w-3.5 h-3.5" /> AI Coach Chat
        </button>
      </div>

      {/* Tab 1: Natural Language Task Creation */}
      {activeTab === 'nlp' && (
        <div className="space-y-6">
          <Card className="border-violet-200/80 dark:border-violet-900/60 shadow-sm">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600" />
                Natural-Language Task Creation
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Type what you need to do in plain English. SmartFlow parses deadlines, priorities, and estimated times automatically.
              </p>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-4">
              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={nlpInput}
                  onChange={e => setNlpInput(e.target.value)}
                  placeholder="e.g. Tomorrow at 3pm, prepare science presentation and spend 45 minutes studying mathematics."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-violet-500"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Pro-tip: Mention words like "tomorrow", "urgent", "45 mins", "next week"
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleParseNlp}
                    disabled={!nlpInput.trim()}
                    className="gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" /> Parse Tasks
                  </Button>
                </div>
              </div>

              {/* Parsed Tasks Preview & Confirmation */}
              {parsedSuggestions.length > 0 && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Proposed Tasks for Review ({parsedSuggestions.length})
                    </h3>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => saveNlpTasksMutation.mutate(parsedSuggestions)}
                      disabled={saveNlpTasksMutation.isPending}
                      className="gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" /> Confirm &amp; Save All to Tasks
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {parsedSuggestions.map((st, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200/60 dark:border-violet-900/40 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-violet-600" />
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{st.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={st.priority} />
                          <span className="text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> {st.estimatedMinutes}m
                          </span>
                          <span className="text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />{' '}
                            {new Date(st.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Automatic Task Breakdown */}
      {activeTab === 'breakdown' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-violet-600" />
                Automatic Task Breakdown
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Break down overwhelming or high-level milestones into manageable, actionable subtasks.
              </p>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Break Down an Existing Task
                  </label>
                  <select
                    value={breakdownTaskId}
                    onChange={e => {
                      setBreakdownTaskId(e.target.value);
                      const t = pendingTasks.find(pt => pt.id === e.target.value);
                      if (t) setCustomBreakdownTitle(t.title);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200"
                  >
                    <option value="">Select a pending task...</option>
                    {pendingTasks.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.priority})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Or Enter Any Goal / Project Title
                  </label>
                  <input
                    type="text"
                    value={customBreakdownTitle}
                    onChange={e => setCustomBreakdownTitle(e.target.value)}
                    placeholder="e.g. Build modern portfolio website with React"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => breakdownMutation.mutate(customBreakdownTitle)}
                  disabled={!customBreakdownTitle.trim() || breakdownMutation.isPending}
                  className="gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Break Down Task
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 3: Daily Planning */}
      {activeTab === 'dayplan' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-violet-600" />
                Intelligent Daily Scheduling
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                AI analyzes your deadlines, task priorities, and duration estimates to construct an optimal time-blocked plan for today.
              </p>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Ready to schedule {pendingTasks.length} pending tasks
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Includes priority ordering, energy level optimization, and buffer breaks.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => planDayMutation.mutate()}
                  disabled={planDayMutation.isPending}
                  className="gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Generate Today's Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 4: Rescheduling Assistance */}
      {activeTab === 'reschedule' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-violet-600" />
                Rescheduling &amp; Overload Assistance
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Detect bottleneck deadlines, overloaded days, and overdue tasks. AI suggests realistic alternatives so you never fall behind.
              </p>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-4">
              <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    {overdueTasks.length > 0
                      ? `${overdueTasks.length} overdue tasks detected!`
                      : 'No overdue tasks detected'}
                  </p>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                    Click below to generate smart, balanced rescheduling suggestions.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => rescheduleMutation.mutate()}
                  disabled={rescheduleMutation.isPending}
                  className="gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Analyze &amp; Reschedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 5: AI Coach Chat */}
      {activeTab === 'chat' && (
        <div className="space-y-4">
          <Card className="h-[480px] flex flex-col">
            <CardHeader className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-violet-600" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  SmartFlow Productivity Chat Assistant
                </span>
              </div>
            </CardHeader>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 text-xs ${
                    m.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] p-3 rounded-2xl whitespace-pre-wrap leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-violet-600 text-white rounded-br-none'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <input
                type="text"
                value={chatPrompt}
                onChange={e => setChatPrompt(e.target.value)}
                placeholder="Ask advice on organizing your schedule, prioritization, or study strategies..."
                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-violet-500"
              />
              <Button type="submit" variant="primary" size="sm" disabled={!chatPrompt.trim() || chatMutation.isPending}>
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* Confirmation Modal for AI Generated Suggestions */}
      {confirmModal.isOpen && (
        <Modal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          title={confirmModal.title}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">{confirmModal.description}</p>

            {/* Breakdown Subtasks List */}
            {confirmModal.type === 'breakdown' && confirmModal.data && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {confirmModal.data.subtasks.map((st: any, i: number) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">{st.title}</span>
                    <span className="text-[11px] text-slate-400">{st.estimatedMinutes}m</span>
                  </div>
                ))}
              </div>
            )}

            {/* Day Plan Schedule List */}
            {confirmModal.type === 'plan' && confirmModal.data && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {confirmModal.data.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-violet-600 dark:text-violet-400">{item.timeSlot}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{item.title}</span>
                    <PriorityBadge priority={item.priority} />
                  </div>
                ))}
              </div>
            )}

            {/* Reschedule Suggestions List */}
            {confirmModal.type === 'reschedule' && confirmModal.data && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {confirmModal.data.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">{item.taskTitle}</span>
                    <span className="text-indigo-600 dark:text-indigo-400">
                      New: {new Date(item.proposedDueDate).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              >
                Cancel
              </Button>
              {confirmModal.type === 'breakdown' && breakdownTaskId && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    saveSubtasksMutation.mutate({
                      taskId: breakdownTaskId,
                      subtasks: confirmModal.data.subtasks,
                    })
                  }
                >
                  Save Subtasks to Task
                </Button>
              )}
              {confirmModal.type === 'reschedule' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => applyRescheduleMutation.mutate(confirmModal.data)}
                >
                  Apply Rescheduled Dates
                </Button>
              )}
              {confirmModal.type === 'plan' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                >
                  Done
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
