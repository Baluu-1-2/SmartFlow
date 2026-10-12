import { z } from 'zod';

export const createHabitSchema = z.object({
  title: z.string().min(1, 'Habit title is required').max(150),
  description: z.string().max(500).optional().nullable(),
  frequency: z.enum(['daily', 'weekdays', 'weekends', 'custom']).default('daily'),
  targetDays: z.array(z.number().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#10b981'),
});

export const updateHabitSchema = createHabitSchema.partial().extend({
  isArchived: z.boolean().optional(),
});

export const toggleHabitDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  notes: z.string().max(300).optional().nullable(),
});
