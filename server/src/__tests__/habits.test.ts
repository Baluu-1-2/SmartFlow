import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../config/prisma.js';

describe('Habits API & Streak Calculations', () => {
  let authToken = '';
  let habitId = '';

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: `habit_test_${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'Habit Tester',
    });
    authToken = res.body.data.token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: 'habit_test_' } },
    });
  });

  it('should create a habit', async () => {
    const res = await request(app)
      .post('/api/habits')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Morning Yoga',
        frequency: 'daily',
        color: '#10b981',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Morning Yoga');
    expect(res.body.data.currentStreak).toBe(0);

    habitId = res.body.data.id;
  });

  it('should toggle habit completions and calculate streak correctly', async () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Mark completed for yesterday
    const res1 = await request(app)
      .post(`/api/habits/${habitId}/toggle-date`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ date: yesterdayStr });
    expect(res1.status).toBe(201);
    expect(res1.body.data.completed).toBe(true);

    // Mark completed for today
    const res2 = await request(app)
      .post(`/api/habits/${habitId}/toggle-date`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ date: todayStr });
    expect(res2.status).toBe(201);

    // Fetch habits to verify computed streaks
    const habitsRes = await request(app)
      .get('/api/habits')
      .set('Authorization', `Bearer ${authToken}`);

    const habit = habitsRes.body.data.find((h: any) => h.id === habitId);
    expect(habit.currentStreak).toBe(2);
    expect(habit.longestStreak).toBe(2);
  });
});
