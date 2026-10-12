import { Router } from 'express';
import authRoutes from './auth.routes.js';
import taskRoutes from './task.routes.js';
import projectRoutes from './project.routes.js';
import habitRoutes from './habit.routes.js';
import focusRoutes from './focus.routes.js';
import analyticsRoutes from './analytics.routes.js';
import aiRoutes from './ai.routes.js';
import tagRoutes from './tag.routes.js';
import notifRoutes from './notification.routes.js';
import { prisma } from '../config/prisma.js';
import { AIService } from '../services/ai.service.js';

const router = Router();

// Health check endpoint (Section 9)
router.get('/health', async (req, res) => {
  try {
    // Check database responsiveness
    await prisma.user.count();
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'connected',
      aiConfigured: AIService.isConfigured(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Database check failed';
    res.status(503).json({
      status: 'degraded',
      error: message,
      timestamp: new Date().toISOString(),
    });
  }
});

router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/projects', projectRoutes);
router.use('/habits', habitRoutes);
router.use('/focus', focusRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/ai', aiRoutes);
router.use('/tags', tagRoutes);
router.use('/notifications', notifRoutes);

export default router;
