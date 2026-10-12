import React from 'react';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderKanban,
  Flame,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.js';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';

export function Analytics() {
  const { data: analyticsResponse, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.get('/analytics'),
  });

  const data = analyticsResponse?.data || {
    totalTasksCount: 0,
    completedTasksCount: 0,
    overdueTasksCount: 0,
    completionRate: 0,
    priorityBreakdown: { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 },
    dailyCompletionTrend: [],
    totalFocusMinutes: 0,
    todayFocusMinutes: 0,
    projectSummaries: [],
    activeHabitsCount: 0,
  };

  const trend = data.dailyCompletionTrend || [];
  const maxTrend = Math.max(...trend.map((t: any) => t.completedCount), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-violet-600" /> Productivity Analytics
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Real metrics computed directly from your tasks, focus logs, and habit history
        </p>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading productivity report...</div>
      ) : (
        <>
          {/* Top 4 KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Completion Rate</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                {data.completionRate}%
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {data.completedTasksCount} of {data.totalTasksCount} tasks finished
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Deep Work</span>
                <Clock className="w-4 h-4 text-violet-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                {data.totalFocusMinutes} <span className="text-sm font-normal text-slate-400">min</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {Math.round(data.totalFocusMinutes / 60)} hours of recorded focus
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Active Projects</span>
                <FolderKanban className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                {data.projectSummaries?.length || 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Under active management</p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Active Habits</span>
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                {data.activeHabitsCount}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Daily consistency routines</p>
            </Card>
          </div>

          {/* 7-Day Completion Trend Chart */}
          <Card className="p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-violet-600" /> 7-Day Task Completion Trend
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tasks completed per day over the last 7 days
                </p>
              </div>
            </div>

            {trend.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No activity recorded in the past 7 days.</p>
            ) : (
              <div className="flex items-end justify-between gap-2 h-44 pt-6 px-2">
                {trend.map((t: any, idx: number) => {
                  const heightPercent = maxTrend > 0 ? (t.completedCount / maxTrend) * 100 : 0;

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        {t.completedCount}
                      </span>
                      <div className="w-full max-w-[40px] bg-slate-100 dark:bg-slate-800 rounded-t-lg h-full flex items-end overflow-hidden">
                        <div
                          className="w-full bg-violet-600 dark:bg-violet-500 rounded-t-lg transition-all duration-500 group-hover:bg-violet-700"
                          style={{ height: `${Math.max(heightPercent, 6)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {t.dayName}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Tasks By Priority Breakdown & Project Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Priority Distribution */}
            <Card className="p-6">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4">
                Completed Tasks by Priority
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Urgent Priority', key: 'URGENT', color: 'bg-rose-500', count: data.priorityBreakdown.URGENT },
                  { label: 'High Priority', key: 'HIGH', color: 'bg-amber-500', count: data.priorityBreakdown.HIGH },
                  { label: 'Medium Priority', key: 'MEDIUM', color: 'bg-blue-500', count: data.priorityBreakdown.MEDIUM },
                  { label: 'Low Priority', key: 'LOW', color: 'bg-slate-400', count: data.priorityBreakdown.LOW },
                ].map(item => {
                  const percent = data.completedTasksCount > 0 ? Math.round((item.count / data.completedTasksCount) * 100) : 0;
                  return (
                    <div key={item.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {item.count} ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`${item.color} h-full rounded-full transition-all duration-500`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Project Progress */}
            <Card className="p-6">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4">
                Active Projects Progress
              </h3>
              {data.projectSummaries?.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No projects to display.</p>
              ) : (
                <div className="space-y-4">
                  {data.projectSummaries.map((p: any) => (
                    <div key={p.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                          {p.name}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {p.progress}% ({p.completed}/{p.total})
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${p.progress}%`, backgroundColor: p.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
