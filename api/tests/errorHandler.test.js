const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');
const userModel = require('../src/models/user.model');
const authService = require('../src/services/auth.service');

const ADMIN_EMAIL = 'test-error-handler-admin@survey-siswa.test';
const PASSWORD = 'test-password-123';

describe('Error handler', () => {
  let adminToken;

  beforeAll(async () => {
    await db('users').where({ email: ADMIN_EMAIL }).del();
    const admin = await userModel.create({
      nama: 'Test Admin',
      email: ADMIN_EMAIL,
      password_hash: await authService.hashPassword(PASSWORD),
      role: 'admin',
    });
    adminToken = authService.generateToken(admin);
  });

  afterAll(async () => {
    await db('users').where({ email: ADMIN_EMAIL }).del();
    await db.destroy();
  });

  it('hides internal error details for unexpected (unstatused) errors', async () => {
    const res = await request(app)
      .get('/api/users/not-a-valid-uuid')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
    expect(res.body.error.message).toBe('Internal server error');
    expect(res.body.error.message).not.toMatch(/uuid|syntax|postgres/i);
  });

  it('still shows deliberate error messages for errors thrown with a status', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_EMAIL, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Email atau password salah');
  });
});
