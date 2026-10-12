import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../config/prisma.js';

describe('Tasks API & Multi-Tenant Security Tests', () => {
  let userAToken = '';
  let userBToken = '';
  let createdTaskId = '';

  beforeAll(async () => {
    // Register User A
    const resA = await request(app).post('/api/auth/register').send({
      email: `user_a_${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'User A',
    });
    userAToken = resA.body.data.token;

    // Register User B
    const resB = await request(app).post('/api/auth/register').send({
      email: `user_b_${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'User B',
    });
    userBToken = resB.body.data.token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: 'user_' } },
    });
  });

  it('should create a task with subtasks and priority', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        title: 'Complete security audit',
        description: 'Verify all endpoint ownership checks',
        priority: 'URGENT',
        estimatedMinutes: 60,
        subtasks: [
          { title: 'Check tasks controller', isCompleted: false },
          { title: 'Check projects controller', isCompleted: false },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Complete security audit');
    expect(res.body.data.priority).toBe('URGENT');
    expect(res.body.data.subtasks.length).toBe(2);

    createdTaskId = res.body.data.id;
  });

  it('should list tasks with filter and search options', async () => {
    const res = await request(app)
      .get('/api/tasks?search=security')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].id).toBe(createdTaskId);

    // Test filter=pending
    const resPending = await request(app)
      .get('/api/tasks?filter=pending')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(resPending.status).toBe(200);
    expect(resPending.body.data.some((t: any) => t.id === createdTaskId)).toBe(true);
  });

  it('should toggle task status between TODO and COMPLETED', async () => {
    const resToggle = await request(app)
      .patch(`/api/tasks/${createdTaskId}/toggle`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(resToggle.status).toBe(200);
    expect(resToggle.body.data.status).toBe('COMPLETED');

    const resReopen = await request(app)
      .patch(`/api/tasks/${createdTaskId}/toggle`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(resReopen.status).toBe(200);
    expect(resReopen.body.data.status).toBe('TODO');
  });

  it('should enforce multi-tenant isolation: User B cannot access User A task', async () => {
    const res = await request(app)
      .get(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(404); // Forbidden/not found for User B
  });

  it('should enforce multi-tenant isolation: User B cannot update User A task', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ title: 'Hacked Title' });

    expect(res.status).toBe(404);
  });

  it('should enforce multi-tenant isolation: User B cannot delete User A task', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(404);

    // Verify task still exists for User A
    const verifyRes = await request(app)
      .get(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${userAToken}`);
    expect(verifyRes.status).toBe(200);
  });

  it('should allow User A to delete their task', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.deleted).toBe(true);

    const getRes = await request(app)
      .get(`/api/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${userAToken}`);
    expect(getRes.status).toBe(404);
  });
});
