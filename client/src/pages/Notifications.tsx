import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Calendar,
  Sparkles,
  Clock,
  Shield,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';

export function Notifications() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'reminders'>('all');
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(() => {
    return typeof Notification !== 'undefined' ? Notification.permission : 'default';
  });

  const { data: notifResponse, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications'),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}`, { isRead: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.post('/notifications/mark-all-read'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const requestBrowserPermission = async () => {
    if (typeof Notification !== 'undefined') {
      const res = await Notification.requestPermission();
      setBrowserPermission(res);
      if (res === 'granted') {
        new Notification('SmartFlow Notifications Enabled', {
          body: 'You will receive timely alerts for upcoming tasks and deadlines!',
          icon: '/assets/icons/icon_128.png',
        });
      }
    }
  };

  const notifications: any[] = notifResponse?.data?.notifications || [];
  const unreadCount = notifResponse?.data?.unreadCount || 0;

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'reminders') return n.type === 'REMINDER' || n.type === 'DUE_SOON';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Stay informed with real-time deadline warnings, AI planning recommendations, and system alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              className="gap-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5 text-violet-500" /> Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Browser Notification Permission Banner */}
      <Card className="border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Desktop &amp; Browser Notifications
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {browserPermission === 'granted'
                  ? 'Active: You will receive real-time alerts before task deadlines.'
                  : browserPermission === 'denied'
                  ? 'Blocked: Enable notifications in your browser settings to receive alerts.'
                  : 'Grant notification permission to get alerted when deadlines approach.'}
              </p>
            </div>
          </div>

          {browserPermission !== 'granted' && (
            <Button
              variant="primary"
              size="sm"
              onClick={requestBrowserPermission}
              className="shrink-0 text-xs"
            >
              Enable Notifications
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'all'
              ? 'bg-violet-100 text-violet-900 dark:bg-violet-950/70 dark:text-violet-200'
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'unread'
              ? 'bg-rose-100 text-rose-900 dark:bg-rose-950/70 dark:text-rose-200'
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setActiveTab('reminders')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'reminders'
              ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200'
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Reminders &amp; Deadlines
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {filteredNotifications.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <CheckCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              No notifications right now
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              You are completely caught up! We will alert you when tasks are due or new AI suggestions are ready.
            </p>
          </Card>
        ) : (
          filteredNotifications.map(n => (
            <Card
              key={n.id}
              className={`transition-all hover:shadow-xs ${
                !n.isRead
                  ? 'bg-violet-50/40 dark:bg-violet-950/15 border-violet-200/80 dark:border-violet-900/60'
                  : 'border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="p-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      n.type === 'DUE_SOON' || n.type === 'OVERDUE'
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                        : n.type === 'AI_SUGGESTION'
                        ? 'bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400'
                        : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                    }`}
                  >
                    {n.type === 'DUE_SOON' || n.type === 'OVERDUE' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : n.type === 'AI_SUGGESTION' ? (
                      <Sparkles className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-violet-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {!n.isRead && (
                    <button
                      onClick={() => markReadMutation.mutate(n.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotificationMutation.mutate(n.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
