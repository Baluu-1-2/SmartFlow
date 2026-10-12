import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(300),
  description: z.string().max(2000).optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('TODO'),
  projectId: z.string().optional().nullable(),
  dueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable(),
  estimatedMinutes: z.number().int().nonnegative().optional().nullable(),
  actualMinutes: z.number().int().nonnegative().optional(),
  reminderAt: z.string().datetime().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
  subtasks: z.array(z.object({
    title: z.string().min(1),
    isCompleted: z.boolean().default(false),
  })).optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  order: z.number().int().optional(),
});

export const createSubtaskSchema = z.object({
  title: z.string().min(1, 'Subtask title is required').max(300),
  isCompleted: z.boolean().default(false),
  order: z.number().int().optional(),
});

export const updateSubtaskSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  isCompleted: z.boolean().optional(),
  order: z.number().int().optional(),
});

export const taskQuerySchema = z.object({
  filter: z.enum(['all', 'pending', 'today', 'upcoming', 'overdue', 'completed']).optional().default('all'),
  projectId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  tagId: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['dueDate', 'priority', 'createdAt', 'title', 'order']).optional().default('order'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
});
