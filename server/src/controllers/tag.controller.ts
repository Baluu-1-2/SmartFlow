import { Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

export async function getTags(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const tags = await prisma.tag.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  });
  return sendSuccess(res, tags);
}

export async function createTag(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { name, color = '#6366f1' } = req.body;

  if (!name || typeof name !== 'string') {
    return sendError(res, 'Tag name is required', 400);
  }

  const existing = await prisma.tag.findUnique({
    where: {
      userId_name: {
        userId,
        name: name.trim().toLowerCase(),
      },
    },
  });

  if (existing) {
    return sendSuccess(res, existing);
  }

  const tag = await prisma.tag.create({
    data: {
      userId,
      name: name.trim().toLowerCase(),
      color,
    },
  });

  return sendSuccess(res, tag, 'Tag created', 201);
}

export async function deleteTag(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;
  const { id } = req.params;

  const existing = await prisma.tag.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return sendError(res, 'Tag not found', 404);
  }

  await prisma.tag.delete({ where: { id } });
  return sendSuccess(res, { deleted: true });
}
