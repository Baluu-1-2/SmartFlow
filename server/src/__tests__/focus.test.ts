import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../config/prisma.js';

describe('Focus Sessions API Tests', () => {
  let authToken = '';
  let taskId = '';

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: `focus_test_${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'Focus Tester',
    });
    authToken = res.body.data.token;

    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Focus target task', priority: 'HIGH' });
    taskId = taskRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: 'focus_test_' } },
    });
  });

  it('should record a completed Pomodoro session and update task actualMinutes', async () => {
    const sessionRes = await request(app)
      .post('/api/focus')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        durationMinutes: 25,
        sessionType: 'pomodoro',
        taskId,
        startedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        completedAt: new Date().toISOString(),
      });

    expect(sessionRes.status).toBe(201);
    expect(sessionRes.body.data.durationMinutes).toBe(25);

    // Verify task actualMinutes was incremented by 25
    const taskRes = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(taskRes.body.data.actualMinutes).toBe(25);
  });

  it('should return focus history and calculate today focus minutes', async () => {
    const res = await request(app)
      .get('/api/focus')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.todayFocusMinutes).toBeGreaterThanOrEqual(25);
    expect(res.body.data.todaySessionCount).toBeGreaterThanOrEqual(1);
  });
});
