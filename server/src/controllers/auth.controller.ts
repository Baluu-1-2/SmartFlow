import { Response } from 'express';
import { prisma } from '../config/prisma.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

function setAuthCookie(res: Response, token: string) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

export async function register(req: AuthRequest, res: Response) {
  const { email, password, name } = req.body;

  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    return sendError(res, 'An account with this email address already exists', 409);
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name,
      passwordHash,
      settings: {
        create: {
          focusDuration: 25,
          shortBreakDuration: 5,
          longBreakDuration: 15,
          soundEnabled: true,
          browserNotifications: true,
        },
      },
      projects: {
        create: {
          name: 'Welcome & Getting Started',
          description: 'A quick tour of Smart To-Do AI features',
          color: '#7c3aed',
        },
      },
      habits: {
        create: [
          {
            title: 'Morning Planning & Review',
            description: 'Check today’s priorities before starting work',
            frequency: 'daily',
            targetDays: '[0,1,2,3,4,5,6]',
            color: '#10b981',
          },
          {
            title: '30 Minutes of Focused Reading',
            description: 'Read an educational book or article',
            frequency: 'weekdays',
            targetDays: '[1,2,3,4,5]',
            color: '#3b82f6',
          },
        ],
      },
    },
    include: {
      settings: true,
    },
  });

  const token = generateToken({ userId: user.id, email: user.email });
  setAuthCookie(res, token);

  const { passwordHash: _, ...safeUser } = user;
  return sendSuccess(res, { user: safeUser, token }, 'Registration successful', 201);
}

export async function login(req: AuthRequest, res: Response) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { settings: true },
  });

  if (!user) {
    return sendError(res, 'Invalid email or password', 401);
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return sendError(res, 'Invalid email or password', 401);
  }

  const token = generateToken({ userId: user.id, email: user.email });
  setAuthCookie(res, token);

  const { passwordHash: _, ...safeUser } = user;
  return sendSuccess(res, { user: safeUser, token }, 'Login successful');
}

export async function logout(req: AuthRequest, res: Response) {
  res.clearCookie('token');
  return sendSuccess(res, { loggedOut: true }, 'Successfully logged out');
}

export async function getMe(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { settings: true },
  });

  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  const { passwordHash: _, ...safeUser } = user;
  return sendSuccess(res, safeUser);
}

export async function updateProfile(req: AuthRequest, res: Response) {
  const { name, timezone, theme, defaultPriority, avatarUrl } = req.body;

  const updatedUser = await prisma.user.update({
    where: { id: req.user!.userId },
    data: {
      ...(name !== undefined && { name }),
      ...(timezone !== undefined && { timezone }),
      ...(theme !== undefined && { theme }),
      ...(defaultPriority !== undefined && { defaultPriority }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    },
    include: { settings: true },
  });

  const { passwordHash: _, ...safeUser } = updatedUser;
  return sendSuccess(res, safeUser, 'Profile updated successfully');
}

export async function updatePassword(req: AuthRequest, res: Response) {
  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
  });

  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  const isValid = await comparePassword(currentPassword, user.passwordHash);
  if (!isValid) {
    return sendError(res, 'Current password is incorrect', 400);
  }

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  return sendSuccess(res, { updated: true }, 'Password changed successfully');
}

export async function exportData(req: AuthRequest, res: Response) {
  const userId = req.user!.userId;

  const [user, projects, tasks, habits, focusSessions] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { settings: true } }),
    prisma.project.findMany({ where: { userId } }),
    prisma.task.findMany({
      where: { userId },
      include: { subtasks: true, taskTags: { include: { tag: true } } },
    }),
    prisma.habit.findMany({
      where: { userId },
      include: { completions: true },
    }),
    prisma.focusSession.findMany({ where: { userId } }),
  ]);

  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  const { passwordHash: _, ...safeUser } = user;
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    user: safeUser,
    projects,
    tasks,
    habits,
    focusSessions,
  };

  return sendSuccess(res, exportPayload, 'Data export generated');
}

export async function deleteAccount(req: AuthRequest, res: Response) {
  const { password } = req.body;
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    return sendError(res, 'Incorrect password. Account deletion requires valid password verification.', 400);
  }

  await prisma.user.delete({ where: { id: userId } });
  res.clearCookie('token');

  return sendSuccess(res, { deleted: true }, 'Account successfully deleted');
}
