import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Moon,
  Clock,
  Shield,
  Download,
  Trash2,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Modal } from '../components/ui/Modal.js';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { useTimer } from '../context/TimerContext.js';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api.js';

export function Settings() {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { configureDurations } = useTimer();

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [defaultPriority, setDefaultPriority] = useState(user?.defaultPriority || 'MEDIUM');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Focus Timer Settings
  const [focusMin, setFocusMin] = useState(user?.settings?.focusDuration || 25);
  const [shortBreakMin, setShortBreakMin] = useState(user?.settings?.shortBreakDuration || 5);
  const [longBreakMin, setLongBreakMin] = useState(user?.settings?.longBreakDuration || 15);
  const [timerSaved, setTimerSaved] = useState(false);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Delete Account Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => api.put('/auth/profile', data),
    onSuccess: res => {
      if (res.data) {
        updateUser(res.data);
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      }
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (data: any) => api.put('/auth/password', data),
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setPasswordError('');
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    },
    onError: (err: any) => {
      setPasswordError(err.message || 'Failed to update password');
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (data: any) => api.post('/auth/delete-account', data),
    onSuccess: () => {
      logout();
    },
    onError: (err: any) => {
      setDeleteError(err.message || 'Verification failed');
    },
  });

  const handleExportData = async () => {
    try {
      const res = await api.get('/auth/export');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smart-todo-ai-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export data:', err);
    }
  };

  const handleSaveTimerSettings = (e: React.FormEvent) => {
    e.preventDefault();
    configureDurations(focusMin, shortBreakMin, longBreakMin);
    setTimerSaved(true);
    setTimeout(() => setTimerSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-violet-600" /> Account & App Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Customize your workspace, preferences, timers, and data security
        </p>
      </div>

      {/* 1. Profile Information */}
      <Card className="p-6">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-violet-600" /> Personal Profile
        </h3>

        <form
          onSubmit={e => {
            e.preventDefault();
            updateProfileMutation.mutate({ name, timezone, defaultPriority });
          }}
          className="space-y-4 max-w-lg"
        >
          <Input
            label="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="text"
              disabled
              value={user?.email || ''}
              className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">Eastern Time (US / Canada)</option>
                <option value="America/Chicago">Central Time (US / Canada)</option>
                <option value="America/Los_Angeles">Pacific Time (US / Canada)</option>
                <option value="Europe/London">London (GMT / BST)</option>
                <option value="Europe/Paris">Paris, Berlin (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
                <option value="Asia/Kolkata">India (IST)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Default Task Priority
              </label>
              <select
                value={defaultPriority}
                onChange={e => setDefaultPriority(e.target.value as any)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" size="sm" isLoading={updateProfileMutation.isPending}>
              Save Profile
            </Button>
            {profileSuccess && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Saved!
              </span>
            )}
          </div>
        </form>
      </Card>

      {/* 2. Theme & Appearance */}
      <Card className="p-6">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
          <Moon className="w-4 h-4 text-violet-600" /> Interface Theme
        </h3>
        <div className="flex items-center gap-3">
          {(['light', 'dark', 'system'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setTheme(mode)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all border ${
                theme === mode
                  ? 'border-violet-600 bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {mode} Mode
            </button>
          ))}
        </div>
      </Card>

      {/* 3. Pomodoro Focus Preferences */}
      <Card className="p-6">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-violet-600" /> Pomodoro Timer Preferences
        </h3>
        <form onSubmit={handleSaveTimerSettings} className="space-y-4 max-w-lg">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Focus (Mins)
              </label>
              <input
                type="number"
                min="5"
                max="90"
                value={focusMin}
                onChange={e => setFocusMin(parseInt(e.target.value, 10) || 25)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Short Break
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={shortBreakMin}
                onChange={e => setShortBreakMin(parseInt(e.target.value, 10) || 5)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Long Break
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={longBreakMin}
                onChange={e => setLongBreakMin(parseInt(e.target.value, 10) || 15)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" size="sm" variant="secondary">
              Update Timer Durations
            </Button>
            {timerSaved && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Updated!
              </span>
            )}
          </div>
        </form>
      </Card>

      {/* 4. Security & Password Change */}
      <Card className="p-6">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-violet-600" /> Account Security
        </h3>
        <form
          onSubmit={e => {
            e.preventDefault();
            if (newPassword.length < 6) {
              setPasswordError('New password must be at least 6 characters');
              return;
            }
            updatePasswordMutation.mutate({ currentPassword, newPassword });
          }}
          className="space-y-4 max-w-lg"
        >
          {passwordError && (
            <p className="text-xs text-rose-500 font-medium">{passwordError}</p>
          )}

          <Input
            label="Current Password"
            type="password"
            required
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
          />

          <Input
            label="New Password"
            type="password"
            required
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            helperText="Minimum 6 characters"
          />

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" size="sm" isLoading={updatePasswordMutation.isPending}>
              Update Password
            </Button>
            {passwordSuccess && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Password Changed!
              </span>
            )}
          </div>
        </form>
      </Card>

      {/* 5. Data Export & Account Deletion */}
      <Card className="p-6 space-y-6">
        {/* Export Data */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Download className="w-4 h-4 text-violet-600" /> Data Portability
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Download your complete workspace including tasks, projects, habits, and history as JSON.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportData} className="gap-1.5 shrink-0">
            <Download className="w-3.5 h-3.5" /> Export All Data
          </Button>
        </div>

        {/* Delete Account */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-rose-600 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-500" /> Danger Zone: Delete Account
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Permanently delete your account and all associated workspace data. This cannot be undone.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setDeletePassword('');
              setDeleteError('');
              setIsDeleteModalOpen(true);
            }}
            className="shrink-0"
          >
            Delete Account
          </Button>
        </div>
      </Card>

      {/* Delete Account Password Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Account Deletion"
        maxWidth="sm"
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            deleteAccountMutation.mutate({ password: deletePassword });
          }}
          className="space-y-4 pt-2"
        >
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              This will irreversibly delete your account, projects, tasks, habits, and all analytics history.
            </span>
          </div>

          {deleteError && (
            <p className="text-xs text-rose-500 font-medium">{deleteError}</p>
          )}

          <Input
            label="Confirm with Password"
            type="password"
            required
            autoFocus
            value={deletePassword}
            onChange={e => setDeletePassword(e.target.value)}
            placeholder="Enter your current password"
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={deleteAccountMutation.isPending}
            >
              Permanently Delete
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
