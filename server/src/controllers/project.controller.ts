import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export async function getProjects(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const includeArchived = req.query.includeArchived === 'true';

  const where: Prisma.ProjectWhereInput = { userId };
  if (!includeArchived) {
    where.isArchived = false;
  }

  const projects = await prisma.project.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          tasks: true,
        },
      },
      tasks: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  // Calculate task completion progress for each project
  const projectsWithProgress = projects.map(p => {
    const total = p.tasks.length;
    const completed = p.tasks.filter((t: { status: string }) => t.status === 'COMPLETED').length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    const { tasks: _, ...projectWithoutTasks } = p;
    return {
      ...projectWithoutTasks,
      totalTasks: total,
      completedTasks: completed,
      progress,
    };
  });

  return sendSuccess(res, projectsWithProgress);
}

export async function getProjectById(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { id } = req.params;

  const project = await prisma.project.findFirst({
    where: { id, userId },
    include: {
      tasks: {
        include: {
          subtasks: true,
          taskTags: { include: { tag: true } },
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!project) {
    return sendError(res, 'Project not found or access denied', 404);
  }

  const total = project.tasks.length;
  const completed = project.tasks.filter((t: { status: string }) => t.status === 'COMPLETED').length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return sendSuccess(res, {
    ...project,
    totalTasks: total,
    completedTasks: completed,
    progress,
  });
}

export async function createProject(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { name, description, color = '#7c3aed', category } = req.body;

  const project = await prisma.project.create({
    data: {
      userId,
      name,
      description,
      color,
      category,
    },
  });

  return sendSuccess(res, project, 'Project created', 201);
}

export async function updateProject(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { id } = req.params;
  const { name, description, color, category, isArchived } = req.body;

  const existing = await prisma.project.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return sendError(res, 'Project not found or access denied', 404);
  }

  const updated = await prisma.project.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(color !== undefined && { color }),
      ...(category !== undefined && { category }),
      ...(isArchived !== undefined && { isArchived }),
    },
  });

  return sendSuccess(res, updated, 'Project updated');
}

export async function deleteProject(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { id } = req.params;
  const { deleteTasks = 'false' } = req.query;

  const existing = await prisma.project.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return sendError(res, 'Project not found or access denied', 404);
  }

  if (deleteTasks === 'true') {
    // Explicitly user-requested deletion of tasks in project
    await prisma.task.deleteMany({
      where: { projectId: id, userId },
    });
  } else {
    // Safe default: dissociate tasks so user tasks are preserved!
    await prisma.task.updateMany({
      where: { projectId: id, userId },
      data: { projectId: null },
    });
  }

  await prisma.project.delete({ where: { id } });
  return sendSuccess(res, { deleted: true }, 'Project removed safely');
}
