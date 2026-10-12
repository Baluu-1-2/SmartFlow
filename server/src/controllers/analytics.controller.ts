import { Response } from 'express';
import { Priority } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export async function getAnalytics(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // 7 days ago
  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  // 30 days ago
  const thirtyDaysAgo = new Date(startOfToday);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

  const [
    allTasks,
    completedTasks,
    overdueTasks,
    dueTodayTasks,
    focusSessions,
    projects,
    habits,
  ] = await Promise.all([
    prisma.task.findMany({
      where: { userId },
      select: { id: true, status: true, priority: true, dueDate: true, createdAt: true, updatedAt: true },
    }),
    prisma.task.findMany({
      where: { userId, status: 'COMPLETED' },
      select: { id: true, priority: true, updatedAt: true },
    }),
    prisma.task.count({
      where: {
        userId,
        status: { not: 'COMPLETED' },
        dueDate: { lt: startOfToday },
      },
    }),
    prisma.task.findMany({
      where: {
        userId,
        dueDate: { gte: startOfToday, lte: endOfToday },
      },
      select: { id: true, status: true },
    }),
    prisma.focusSession.findMany({
      where: { userId, completedAt: { gte: thirtyDaysAgo } },
      select: { durationMinutes: true, sessionType: true, completedAt: true },
    }),
    prisma.project.findMany({
      where: { userId, isArchived: false },
      include: {
        tasks: { select: { id: true, status: true } },
      },
    }),
    prisma.habit.findMany({
      where: { userId, isArchived: false },
      include: { completions: { where: { completedAt: { gte: thirtyDaysAgo } } } },
    }),
  ]);

  const totalTasksCount = allTasks.length;
  const completedTasksCount = completedTasks.length;
  const pendingTasksCount = allTasks.filter((t: { status: string }) => t.status !== 'COMPLETED').length;
  const inProgressTasksCount = allTasks.filter((t: { status: string }) => t.status === 'IN_PROGRESS').length;
  const completionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Due today stats
  const dueTodayTotal = dueTodayTasks.length;
  const dueTodayCompleted = dueTodayTasks.filter((t: { status: string }) => t.status === 'COMPLETED').length;
  const dailyProgress = dueTodayTotal > 0 ? Math.round((dueTodayCompleted / dueTodayTotal) * 100) : 0;

  // Tasks completed by priority
  const priorityBreakdown: Record<Priority, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    URGENT: 0,
  };
  completedTasks.forEach((t: { priority: Priority }) => {
    if (priorityBreakdown[t.priority] !== undefined) {
      priorityBreakdown[t.priority]++;
    }
  });

  // Daily completion trend for the last 7 days
  const dailyCompletionTrend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split('T')[0];
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

    const completedOnDay = completedTasks.filter((t: { updatedAt: Date }) => {
      const u = new Date(t.updatedAt);
      return u >= dayStart && u <= dayEnd;
    }).length;

    const focusMinutesOnDay = focusSessions
      .filter((s: { sessionType: string; completedAt: Date }) => {
        const c = new Date(s.completedAt);
        return s.sessionType === 'pomodoro' && c >= dayStart && c <= dayEnd;
      })
      .reduce((sum: number, s: { durationMinutes: number }) => sum + s.durationMinutes, 0);

    dailyCompletionTrend.push({
      date: dayStr,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      completedCount: completedOnDay,
      focusMinutes: focusMinutesOnDay,
    });
  }

  // Total focus time stats
  const totalFocusMinutes = focusSessions
    .filter((s: { sessionType: string }) => s.sessionType === 'pomodoro')
    .reduce((sum: number, s: { durationMinutes: number }) => sum + s.durationMinutes, 0);

  const todayFocusMinutes = focusSessions
    .filter((s: { sessionType: string; completedAt: Date }) => s.sessionType === 'pomodoro' && new Date(s.completedAt) >= startOfToday)
    .reduce((sum: number, s: { durationMinutes: number }) => sum + s.durationMinutes, 0);

  // Projects progress
  const projectSummaries = projects.map((p: { id: string; name: string; color: string; tasks: Array<{ id: string; status: string }> }) => {
    const total = p.tasks.length;
    const completed = p.tasks.filter((t: { status: string }) => t.status === 'COMPLETED').length;
    return {
      id: p.id,
      name: p.name,
      color: p.color,
      total,
      completed,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  return sendSuccess(res, {
    totalTasksCount,
    completedTasksCount,
    pendingTasksCount,
    inProgressTasksCount,
    overdueTasksCount: overdueTasks,
    dueTodayTotal,
    dueTodayCompleted,
    dailyProgress,
    completionRate,
    priorityBreakdown,
    dailyCompletionTrend,
    totalFocusMinutes,
    todayFocusMinutes,
    projectSummaries,
    activeHabitsCount: habits.length,
  });
}
