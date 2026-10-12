import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  Sparkles,
  Timer as TimerIcon,
  Coffee,
  BatteryCharging,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { useTimer, TimerMode } from '../context/TimerContext.js';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';

export function Focus() {
  const {
    mode,
    timeLeft,
    totalDuration,
    isRunning,
    activeTaskId,
    activeTaskTitle,
    setMode,
    startTimer,
    pauseTimer,
    resetTimer,
    selectTaskForFocus,
  } = useTimer();

  // Load pending tasks to select from
  const { data: tasksResponse } = useQuery({
    queryKey: ['tasks', { filter: 'all' }],
    queryFn: () => api.get('/tasks?filter=all&limit=50'),
  });

  // Load focus history & stats
  const { data: focusHistoryResponse } = useQuery({
    queryKey: ['focus', 'history'],
    queryFn: () => api.get('/focus'),
  });

  const pendingTasks = (tasksResponse?.data || []).filter((t: any) => t.status !== 'COMPLETED');
  const historyData = focusHistoryResponse?.data || {
    sessions: [],
    todayFocusMinutes: 0,
    todaySessionCount: 0,
  };

  // Format MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Progress percentage
  const progressPercent = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;

  // SVG Circular progress constants
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const modeButtons: { mode: TimerMode; label: string; icon: any }[] = [
    { mode: 'pomodoro', label: 'Pomodoro (25m)', icon: TimerIcon },
    { mode: 'short_break', label: 'Short Break (5m)', icon: Coffee },
    { mode: 'long_break', label: 'Long Break (15m)', icon: BatteryCharging },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-violet-600" /> Focus Mode & Pomodoro
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Eliminate distractions, focus deeply, and log your productivity sessions
        </p>
      </div>

      {/* Main Timer Card */}
      <Card className="p-8 sm:p-10 flex flex-col items-center justify-center text-center shadow-lg border-violet-100/60 dark:border-violet-950/40 relative overflow-hidden">
        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-8">
          {modeButtons.map(item => {
            const Icon = item.icon;
            const isCurrent = mode === item.mode;
            return (
              <button
                key={item.mode}
                onClick={() => setMode(item.mode)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isCurrent
                    ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Circular Timer Visual */}
        <div className="relative w-72 h-72 flex items-center justify-center my-2">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 280 280">
            {/* Background Track */}
            <circle
              cx="140"
              cy="140"
              r={radius}
              className="text-slate-100 dark:text-slate-800"
              strokeWidth="12"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Dynamic Progress Indicator */}
            <circle
              cx="140"
              cy="140"
              r={radius}
              className="text-violet-600 dark:text-violet-500 transition-all duration-500 ease-linear"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Center Digital Display */}
          <div className="absolute flex flex-col items-center">
            <span className="font-mono text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {timeFormatted}
            </span>
            <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold mt-2">
              {isRunning ? 'Focus in progress' : 'Paused'}
            </span>
            {activeTaskTitle && (
              <span className="text-xs font-medium text-violet-600 dark:text-violet-400 mt-2 max-w-[180px] truncate">
                🎯 {activeTaskTitle}
              </span>
            )}
          </div>
        </div>

        {/* Primary Timer Controls */}
        <div className="flex items-center gap-4 mt-8">
          <Button
            size="lg"
            variant="outline"
            onClick={resetTimer}
            className="w-12 h-12 p-0 rounded-2xl"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </Button>

          <Button
            size="lg"
            variant="primary"
            onClick={isRunning ? pauseTimer : startTimer}
            className="px-8 py-3.5 rounded-2xl text-base shadow-lg shadow-violet-500/25 flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" /> Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current ml-0.5" /> Start Focus
              </>
            )}
          </Button>
        </div>

        {/* Task Focus Link Dropdown */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 w-full max-w-sm">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Link session to a specific task
          </label>
          <select
            value={activeTaskId || ''}
            onChange={e => {
              const id = e.target.value || null;
              const found = pendingTasks.find((t: any) => t.id === id);
              selectTaskForFocus(id, found?.title || null);
            }}
            className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
          >
            <option value="">No task linked (General deep work)</option>
            {pendingTasks.map((t: any) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Today's Focus Summary & Recent Sessions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 text-center">
          <Clock className="w-8 h-8 text-violet-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {historyData.todayFocusMinutes} <span className="text-sm font-normal text-slate-400">minutes</span>
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Focused Deep Work Today</p>
        </Card>

        <Card className="p-6 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {historyData.todaySessionCount} <span className="text-sm font-normal text-slate-400">blocks</span>
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Completed Pomodoro Blocks</p>
        </Card>

        <Card className="p-6 text-center">
          <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {Math.round(historyData.todayFocusMinutes / 25)} <span className="text-sm font-normal text-slate-400">cycles</span>
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Focus Momentum Score</p>
        </Card>
      </div>
    </div>
  );
}
