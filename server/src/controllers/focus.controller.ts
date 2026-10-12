import { Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export async function recordFocusSession(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { durationMinutes, sessionType = 'pomodoro', taskId, startedAt, completedAt } = req.body;

  if (taskId) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
    });
    if (!task) {
      return sendError(res, 'Task not found or access denied', 404);
    }
  }

  const session = await prisma.focusSession.create({
    data: {
      userId,
      durationMinutes,
      sessionType,
      taskId: taskId || null,
      startedAt: new Date(startedAt),
      completedAt: completedAt ? new Date(completedAt) : new Date(),
    },
    include: {
      task: { select: { id: true, title: true } },
    },
  });

  // If tied to a task, increment the task's actualMinutes
  if (taskId && sessionType === 'pomodoro') {
    await prisma.task.update({
      where: { id: taskId },
      data: {
        actualMinutes: { increment: durationMinutes },
      },
    });
  }

  return sendSuccess(res, session, 'Focus session recorded', 201);
}

export async function getFocusHistory(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const limit = Number(req.query.limit) || 30;

  const sessions = await prisma.focusSession.findMany({
    where: { userId },
    orderBy: { completedAt: 'desc' },
    take: limit,
    include: {
      task: { select: { id: true, title: true, priority: true } },
    },
  });

  // Calculate today's focus stats
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const todaySessions = sessions.filter(
    (s: { sessionType: string; completedAt: Date }) =>
      s.sessionType === 'pomodoro' && new Date(s.completedAt) >= startOfToday
  );
  const todayFocusMinutes = todaySessions.reduce(
    (acc: number, s: { durationMinutes: number }) => acc + s.durationMinutes,
    0
  );

  return sendSuccess(res, {
    sessions,
    todayFocusMinutes,
    todaySessionCount: todaySessions.length,
  });
}
