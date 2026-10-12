import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

// Helper to compute consecutive day streaks
function calculateStreaks(completedDates: string[]): { currentStreak: number; longestStreak: number } {
  if (!completedDates.length) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Sort dates ascending
  const uniqueDates = Array.from(new Set(completedDates)).sort();
  const dateObjs = uniqueDates.map((d: string) => new Date(d + 'T00:00:00Z'));

  let longestStreak = 0;
  let currentStreak = 0;
  let tempStreak = 0;

  for (let i = 0; i < dateObjs.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = dateObjs[i - 1];
      const curr = dateObjs[i];
      const diffTime = curr.getTime() - prev.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }

  // Current streak check: does the streak touch today or yesterday?
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const lastDate = uniqueDates[uniqueDates.length - 1];
  if (lastDate === todayStr || lastDate === yesterdayStr) {
    // Traverse backwards from the end
    currentStreak = 1;
    for (let i = dateObjs.length - 1; i > 0; i--) {
      const curr = dateObjs[i];
      const prev = dateObjs[i - 1];
      const diffTime = curr.getTime() - prev.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  } else {
    currentStreak = 0;
  }

  return { currentStreak, longestStreak };
}

export async function getHabits(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const includeArchived = req.query.includeArchived === 'true';

  const where: Prisma.HabitWhereInput = { userId };
  if (!includeArchived) {
    where.isArchived = false;
  }

  const habits = await prisma.habit.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      completions: {
        orderBy: { date: 'desc' },
        take: 60, // Last 60 days
      },
    },
  });

  const habitsWithStats = habits.map(h => {
    const dates = h.completions.map((c: { date: string }) => c.date);
    const { currentStreak, longestStreak } = calculateStreaks(dates);
    return {
      ...h,
      currentStreak,
      longestStreak,
      totalCompletions: h.completions.length,
    };
  });

  return sendSuccess(res, habitsWithStats);
}

export async function createHabit(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { title, description, frequency = 'daily', targetDays = [0, 1, 2, 3, 4, 5, 6], color = '#10b981' } = req.body;

  const habit = await prisma.habit.create({
    data: {
      userId,
      title,
      description,
      frequency,
      targetDays: JSON.stringify(targetDays),
      color,
    },
    include: { completions: true },
  });

  return sendSuccess(res, { ...habit, currentStreak: 0, longestStreak: 0, totalCompletions: 0 }, 'Habit created', 201);
}

export async function updateHabit(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { id } = req.params;
  const { title, description, frequency, targetDays, color, isArchived } = req.body;

  const existing = await prisma.habit.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return sendError(res, 'Habit not found or access denied', 404);
  }

  const updated = await prisma.habit.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(frequency !== undefined && { frequency }),
      ...(targetDays !== undefined && { targetDays: JSON.stringify(targetDays) }),
      ...(color !== undefined && { color }),
      ...(isArchived !== undefined && { isArchived }),
    },
    include: { completions: true },
  });

  const dates = updated.completions.map((c: { date: string }) => c.date);
  const { currentStreak, longestStreak } = calculateStreaks(dates);

  return sendSuccess(res, { ...updated, currentStreak, longestStreak, totalCompletions: updated.completions.length });
}

export async function toggleHabitDate(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { id } = req.params;
  const { date, notes } = req.body;

  const habit = await prisma.habit.findFirst({
    where: { id, userId },
  });

  if (!habit) {
    return sendError(res, 'Habit not found or access denied', 404);
  }

  const existingCompletion = await prisma.habitCompletion.findUnique({
    where: {
      habitId_date: {
        habitId: id,
        date,
      },
    },
  });

  if (existingCompletion) {
    await prisma.habitCompletion.delete({
      where: { id: existingCompletion.id },
    });
    return sendSuccess(res, { completed: false, date }, 'Marked as incomplete');
  } else {
    const created = await prisma.habitCompletion.create({
      data: {
        habitId: id,
        date,
        notes,
      },
    });
    return sendSuccess(res, { completed: true, date, completion: created }, 'Marked as completed', 201);
  }
}

export async function deleteHabit(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { id } = req.params;

  const habit = await prisma.habit.findFirst({
    where: { id, userId },
  });

  if (!habit) {
    return sendError(res, 'Habit not found or access denied', 404);
  }

  await prisma.habit.delete({ where: { id } });
  return sendSuccess(res, { deleted: true }, 'Habit deleted');
}
