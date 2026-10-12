import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().max(1000).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code').default('#7c3aed'),
  category: z.string().max(50).optional().nullable(),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  isArchived: z.boolean().optional(),
});
