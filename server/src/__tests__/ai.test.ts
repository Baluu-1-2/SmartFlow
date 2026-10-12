import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../config/prisma.js';

describe('AI Productivity Assistant Tests', () => {
  let authToken = '';
  let taskId = '';

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: `ai_test_${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'AI Tester',
    });
    authToken = res.body.data.token;

    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Launch Enterprise Portal',
        priority: 'LOW',
        dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // Due in 12h
      });
    taskId = taskRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: 'ai_test_' } },
    });
  });

  it('should generate a daily plan matching the required schema', async () => {
    const res = await request(app)
      .post('/api/ai/plan-day')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary).toBeDefined();
    expect(Array.isArray(res.body.data.schedule)).toBe(true);
  });

  it('should generate subtask breakdowns matching schema', async () => {
    const res = await request(app)
      .post('/api/ai/breakdown')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Launch Enterprise Portal' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.subtasks)).toBe(true);
    expect(res.body.data.subtasks.length).toBeGreaterThan(0);
  });

  it('should propose priority adjustment for urgent deadlines', async () => {
    const res = await request(app)
      .post('/api/ai/prioritize')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.suggestions)).toBe(true);
  });

  it('should apply AI proposals only after user confirmation', async () => {
    const applyRes = await request(app)
      .post('/api/ai/apply-plan')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        priorityChanges: [
          {
            taskId,
            suggestedPriority: 'URGENT',
          },
        ],
        taskId,
        newSubtasks: [
          { title: 'Confirm staging deployment' },
          { title: 'Run automated smoke tests' },
        ],
      });

    expect(applyRes.status).toBe(200);

    // Verify task was actually updated in database
    const taskRes = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(taskRes.body.data.priority).toBe('URGENT');
    expect(taskRes.body.data.subtasks.length).toBe(2);
  });
});
