import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../config/prisma.js';

describe('Projects API & Safe Deletion Tests', () => {
  let authToken = '';
  let projectId = '';
  let taskId = '';

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: `project_test_${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'Project Tester',
    });
    authToken = res.body.data.token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: 'project_test_' } },
    });
  });

  it('should create a project with custom color and category', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Mobile App Revamp',
        description: 'V2 redesign deliverables',
        color: '#2563eb',
        category: 'Engineering',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Mobile App Revamp');
    expect(res.body.data.color).toBe('#2563eb');

    projectId = res.body.data.id;
  });

  it('should assign a task to the project and report progress', async () => {
    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Design app mockups',
        projectId,
        priority: 'HIGH',
      });

    taskId = taskRes.body.data.id;

    const projRes = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(projRes.status).toBe(200);
    expect(projRes.body.data.totalTasks).toBe(1);
    expect(projRes.body.data.progress).toBe(0);

    // Complete task
    await request(app)
      .patch(`/api/tasks/${taskId}/toggle`)
      .set('Authorization', `Bearer ${authToken}`);

    const updatedProjRes = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(updatedProjRes.body.data.progress).toBe(100);
  });

  it('should safely delete project by detaching tasks instead of deleting them', async () => {
    const deleteRes = await request(app)
      .delete(`/api/projects/${projectId}?deleteTasks=false`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(deleteRes.status).toBe(200);

    // The project should be gone
    const getProjRes = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(getProjRes.status).toBe(404);

    // But the task must STILL exist with projectId set to null!
    const getTaskRes = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getTaskRes.status).toBe(200);
    expect(getTaskRes.body.data.id).toBe(taskId);
    expect(getTaskRes.body.data.projectId).toBeNull();
  });
});
