import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../config/prisma.js';

describe('Authentication API Tests', () => {
  const testUser = {
    email: `test_auth_${Date.now()}@example.com`,
    password: 'SecurePassword123!',
    name: 'Auth Test User',
  };

  let authToken = '';

  beforeAll(async () => {
    // Ensure DB connection
    await prisma.user.count();
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({
      where: { email: { contains: 'test_auth_' } },
    });
  });

  it('should successfully register a new user with hashed password and default settings', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.user.passwordHash).toBeUndefined(); // Never expose password hash!
    expect(res.body.data.token).toBeDefined();

    authToken = res.body.data.token;
  });

  it('should reject registration if email is already registered', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should reject registration with invalid email or short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'invalid-email', password: '123', name: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should login successfully with valid credentials and return JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'WrongPassword999!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return current authenticated user profile with valid Bearer token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testUser.email.toLowerCase());
  });

  it('should reject protected route requests when authorization header is missing', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should allow user to update profile details', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Updated Alex Name', timezone: 'Europe/Paris' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Alex Name');
    expect(res.body.data.timezone).toBe('Europe/Paris');
  });

  it('should update password and allow login with new password', async () => {
    const updateRes = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        currentPassword: testUser.password,
        newPassword: 'BrandNewPassword456!',
      });

    expect(updateRes.status).toBe(200);

    // Old password should fail
    const oldLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    expect(oldLogin.status).toBe(401);

    // New password should succeed
    const newLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'BrandNewPassword456!' });
    expect(newLogin.status).toBe(200);
  });
});
