import { Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AIService } from '../services/ai.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export async function chat(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { prompt, conversationId } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return sendError(res, 'Prompt is required', 400);
  }

  // Load user context
  const [tasks, habits, projects] = await Promise.all([
    prisma.task.findMany({ where: { userId } }),
    prisma.habit.findMany({ where: { userId, isArchived: false } }),
    prisma.project.findMany({ where: { userId, isArchived: false } }),
  ]);

  let convId = conversationId;
  if (!convId) {
    const newConv = await prisma.aIConversation.create({
      data: {
        userId,
        title: prompt.slice(0, 40) + '...',
      },
    });
    convId = newConv.id;
  }

  // Record user message
  await prisma.aIMessage.create({
    data: {
      conversationId: convId,
      role: 'user',
      content: prompt,
    },
  });

  const reply = await AIService.chat(prompt, {
    userTasks: tasks,
    userHabits: habits,
    userProjects: projects,
  });

  // Record assistant reply
  const assistantMsg = await prisma.aIMessage.create({
    data: {
      conversationId: convId,
      role: 'assistant',
      content: reply,
    },
  });

  return sendSuccess(res, {
    conversationId: convId,
    message: assistantMsg,
    isAIConfigured: AIService.isConfigured(),
  });
}

export async function getConversations(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;

  const conversations = await prisma.aIConversation.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return sendSuccess(res, {
    conversations,
    isAIConfigured: AIService.isConfigured(),
  });
}

export async function planDay(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;

  const pendingTasks = await prisma.task.findMany({
    where: { userId, status: { not: 'COMPLETED' } },
    orderBy: { priority: 'desc' },
  });

  const plan = await AIService.generateDailyPlan(pendingTasks);

  return sendSuccess(res, {
    ...plan,
    isAIConfigured: AIService.isConfigured(),
  });
}

export async function breakdownGoal(req: AuthRequest, res: Response) {
  const { title, description } = req.body;
  if (!title || typeof title !== 'string') {
    return sendError(res, 'Task title is required for breakdown', 400);
  }

  const breakdown = await AIService.breakdownTask(title, description);

  return sendSuccess(res, {
    ...breakdown,
    isAIConfigured: AIService.isConfigured(),
  });
}

export async function prioritizePending(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;

  const pendingTasks = await prisma.task.findMany({
    where: { userId, status: { not: 'COMPLETED' } },
  });

  const suggestions = await AIService.suggestPriorities(pendingTasks);

  return sendSuccess(res, {
    ...suggestions,
    isAIConfigured: AIService.isConfigured(),
  });
}

export async function applyPlan(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { priorityChanges, newSubtasks, taskId } = req.body;

  let appliedChanges = 0;

  // 1. Apply priority changes if user confirmed
  if (Array.isArray(priorityChanges) && priorityChanges.length > 0) {
    for (const change of priorityChanges) {
      if (change.taskId && change.suggestedPriority) {
        const task = await prisma.task.findFirst({
          where: { id: change.taskId, userId },
        });
        if (task) {
          await prisma.task.update({
            where: { id: task.id },
            data: { priority: change.suggestedPriority },
          });
          appliedChanges++;
        }
      }
    }
  }

  // 2. Add confirmed subtasks to task
  if (taskId && Array.isArray(newSubtasks) && newSubtasks.length > 0) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
    });
    if (task) {
      for (let i = 0; i < newSubtasks.length; i++) {
        await prisma.subtask.create({
          data: {
            taskId: task.id,
            title: newSubtasks[i].title,
            order: i,
          },
        });
        appliedChanges++;
      }
    }
  }

  return sendSuccess(res, { appliedChanges }, `Applied ${appliedChanges} confirmed AI recommendations.`);
}

export async function getRescheduleSuggestions(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const tasks = await prisma.task.findMany({ where: { userId } });
  const result = await AIService.suggestRescheduling(tasks);
  return sendSuccess(res, result);
}
