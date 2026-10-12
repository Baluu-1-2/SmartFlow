import { Response } from 'express';
import { Prisma, Priority } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export async function getTasks(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const {
    filter = 'all',
    projectId,
    priority,
    tagId,
    search,
    sortBy = 'order',
    sortOrder = 'asc',
    page = 1,
    limit = 50,
  } = req.query as {
    filter?: string;
    projectId?: string;
    priority?: Priority;
    tagId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: string | number;
    limit?: string | number;
  };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const where: Prisma.TaskWhereInput = { userId };

  if (projectId) {
    where.projectId = projectId;
  }

  if (priority) {
    where.priority = priority;
  }

  if (tagId) {
    where.taskTags = { some: { tagId } };
  }

  if (search && typeof search === 'string' && search.trim()) {
    where.OR = [
      { title: { contains: search.trim(), mode: 'insensitive' } },
      { description: { contains: search.trim(), mode: 'insensitive' } },
    ];
  }

  // Filter types
  switch (filter) {
    case 'pending':
      where.status = { not: 'COMPLETED' };
      break;
    case 'today':
      where.status = { not: 'COMPLETED' };
      where.dueDate = {
        gte: startOfToday,
        lte: endOfToday,
      };
      break;
    case 'upcoming':
      where.status = { not: 'COMPLETED' };
      where.dueDate = {
        gt: endOfToday,
      };
      break;
    case 'overdue':
      where.status = { not: 'COMPLETED' };
      where.dueDate = {
        lt: startOfToday,
      };
      break;
    case 'completed':
      where.status = 'COMPLETED';
      break;
    case 'all':
    default:
      // Show all tasks
      break;
  }

  const orderBy: Prisma.TaskOrderByWithRelationInput = {};
  if (sortBy === 'priority') {
    orderBy.priority = sortOrder;
  } else if (sortBy === 'dueDate') {
    orderBy.dueDate = sortOrder;
  } else if (sortBy === 'createdAt') {
    orderBy.createdAt = sortOrder;
  } else if (sortBy === 'title') {
    orderBy.title = sortOrder;
  } else {
    orderBy.order = sortOrder;
  }

  const take = Number(limit);
  const skip = (Number(page) - 1) * take;

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy,
      take,
      skip,
      include: {
        project: {
          select: { id: true, name: true, color: true },
        },
        subtasks: {
          orderBy: { order: 'asc' },
        },
        taskTags: {
          include: {
            tag: true,
          },
        },
      },
    }),
    prisma.task.count({ where }),
  ]);

  return sendSuccess(res, tasks, undefined, 200, {
    page: Number(page),
    limit: take,
    total,
    totalPages: Math.ceil(total / take) || 1,
  });
}

export async function getTaskById(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { id } = req.params;

  const task = await prisma.task.findFirst({
    where: { id, userId },
    include: {
      project: true,
      subtasks: { orderBy: { order: 'asc' } },
      taskTags: { include: { tag: true } },
    },
  });

  if (!task) {
    return sendError(res, 'Task not found', 404);
  }

  return sendSuccess(res, task);
}

export async function createTask(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const {
    title,
    description,
    priority = 'MEDIUM',
    status = 'TODO',
    projectId,
    dueDate,
    estimatedMinutes,
    actualMinutes = 0,
    reminderAt,
    tagIds = [],
    subtasks = [],
  } = req.body;

  if (projectId) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) {
      return sendError(res, 'Project not found or access denied', 404);
    }
  }

  const maxOrderTask = await prisma.task.findFirst({
    where: { userId },
    orderBy: { order: 'desc' },
    select: { order: true },
  });
  const newOrder = (maxOrderTask?.order ?? -1) + 1;

  const createdTask = await prisma.task.create({
    data: {
      userId,
      title,
      description,
      priority,
      status,
      projectId: projectId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      estimatedMinutes,
      actualMinutes,
      reminderAt: reminderAt ? new Date(reminderAt) : null,
      order: newOrder,
      subtasks: {
        create: subtasks.map((st: { title: string; isCompleted?: boolean }, idx: number) => ({
          title: st.title,
          isCompleted: Boolean(st.isCompleted),
          order: idx,
        })),
      },
      taskTags: {
        create: tagIds.map((tagId: string) => ({
          tagId,
        })),
      },
    },
    include: {
      project: { select: { id: true, name: true, color: true } },
      subtasks: true,
      taskTags: { include: { tag: true } },
    },
  });

  return sendSuccess(res, createdTask, 'Task created successfully', 201);
}

export async function updateTask(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { id } = req.params;
  const data = req.body;

  const existing = await prisma.task.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return sendError(res, 'Task not found or access denied', 404);
  }

  if (data.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: data.projectId, userId },
    });
    if (!project) {
      return sendError(res, 'Project not found or access denied', 404);
    }
  }

  const updateData: Prisma.TaskUncheckedUpdateInput = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.projectId !== undefined) updateData.projectId = data.projectId;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  if (data.estimatedMinutes !== undefined) updateData.estimatedMinutes = data.estimatedMinutes;
  if (data.actualMinutes !== undefined) updateData.actualMinutes = data.actualMinutes;
  if (data.reminderAt !== undefined) updateData.reminderAt = data.reminderAt ? new Date(data.reminderAt) : null;
  if (data.order !== undefined) updateData.order = data.order;

  // Handle tag updates if provided
  if (Array.isArray(data.tagIds)) {
    await prisma.taskTag.deleteMany({ where: { taskId: id } });
    updateData.taskTags = {
      create: data.tagIds.map((tagId: string) => ({ tagId })),
    };
  }

  const updated = await prisma.task.update({
    where: { id },
    data: updateData,
    include: {
      project: { select: { id: true, name: true, color: true } },
      subtasks: { orderBy: { order: 'asc' } },
      taskTags: { include: { tag: true } },
    },
  });

  return sendSuccess(res, updated, 'Task updated successfully');
}

export async function toggleTaskStatus(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { id } = req.params;

  const existing = await prisma.task.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return sendError(res, 'Task not found or access denied', 404);
  }

  const nextStatus = existing.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';

  const updated = await prisma.task.update({
    where: { id },
    data: { status: nextStatus },
    include: {
      project: { select: { id: true, name: true, color: true } },
      subtasks: true,
      taskTags: { include: { tag: true } },
    },
  });

  return sendSuccess(res, updated, `Task marked as ${nextStatus.toLowerCase()}`);
}

export async function deleteTask(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { id } = req.params;

  const existing = await prisma.task.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return sendError(res, 'Task not found or access denied', 404);
  }

  await prisma.task.delete({ where: { id } });
  return sendSuccess(res, { deleted: true }, 'Task deleted successfully');
}

export async function createSubtask(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { taskId } = req.params;
  const { title } = req.body;

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
  });

  if (!task) {
    return sendError(res, 'Task not found or access denied', 404);
  }

  const maxSubtask = await prisma.subtask.findFirst({
    where: { taskId },
    orderBy: { order: 'desc' },
  });
  const newOrder = (maxSubtask?.order ?? -1) + 1;

  const subtask = await prisma.subtask.create({
    data: {
      taskId,
      title,
      order: newOrder,
    },
  });

  return sendSuccess(res, subtask, 'Subtask added', 201);
}

export async function updateSubtask(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { subtaskId } = req.params;
  const { title, isCompleted, order } = req.body;

  const subtask = await prisma.subtask.findUnique({
    where: { id: subtaskId },
    include: { task: true },
  });

  if (!subtask || subtask.task.userId !== userId) {
    return sendError(res, 'Subtask not found or access denied', 404);
  }

  const updated = await prisma.subtask.update({
    where: { id: subtaskId },
    data: {
      ...(title !== undefined && { title }),
      ...(isCompleted !== undefined && { isCompleted }),
      ...(order !== undefined && { order }),
    },
  });

  return sendSuccess(res, updated);
}

export async function deleteSubtask(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { subtaskId } = req.params;

  const subtask = await prisma.subtask.findUnique({
    where: { id: subtaskId },
    include: { task: true },
  });

  if (!subtask || subtask.task.userId !== userId) {
    return sendError(res, 'Subtask not found or access denied', 404);
  }

  await prisma.subtask.delete({ where: { id: subtaskId } });
  return sendSuccess(res, { deleted: true }, 'Subtask deleted');
}
