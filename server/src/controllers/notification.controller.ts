import { Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export async function getNotifications(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;

  // Auto-generate notifications for overdue or due-today tasks if not already notified
  const now = new Date();
  const dueTasks = await prisma.task.findMany({
    where: {
      userId,
      status: { not: 'COMPLETED' },
      dueDate: { lte: now },
    },
    take: 5,
  });

  for (const t of dueTasks) {
    const existingNotif = await prisma.notification.findFirst({
      where: {
        userId,
        link: `/tasks?id=${t.id}`,
      },
    });

    if (!existingNotif) {
      await prisma.notification.create({
        data: {
          userId,
          title: 'Task Due',
          message: `Task "${t.title}" is due now.`,
          type: 'reminder',
          link: `/tasks?id=${t.id}`,
        },
      });
    }
  }

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const unreadCount = notifications.filter((n: { isRead: boolean }) => !n.isRead).length;

  return sendSuccess(res, {
    notifications,
    unreadCount,
  });
}

export async function markAsRead(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { id } = req.params;

  await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });

  return sendSuccess(res, { success: true });
}

export async function markAllAsRead(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return sendSuccess(res, { success: true });
}
