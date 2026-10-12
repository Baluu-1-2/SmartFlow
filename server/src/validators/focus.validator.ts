import { z } from 'zod';

export const createFocusSessionSchema = z.object({
  durationMinutes: z.number().int().positive('Duration must be greater than 0').max(180),
  sessionType: z.enum(['pomodoro', 'short_break', 'long_break']).default('pomodoro'),
  taskId: z.string().optional().nullable(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
});
