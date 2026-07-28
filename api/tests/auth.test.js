const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');
const userModel = require('../src/models/user.model');
const authService = require('../src/services/auth.service');
const { authorize } = require('../src/middlewares/auth');

const TEST_EMAIL = 'test-auth@survey-siswa.test';
const TEST_PASSWORD = 'test-password-123';

describe('Auth', () => {
  let testUser;

  beforeAll(async () => {
    await db('users').where({ email: TEST_EMAIL }).del();
    testUser = await userModel.create({
      nama: 'Test Siswa',
      email: TEST_EMAIL,
      password_hash: await authService.hashPassword(TEST_PASSWORD),
      role: 'siswa',
    });
  });

  afterAll(async () => {
    await db('users').where({ email: TEST_EMAIL }).del();
    await db.destroy();
  });

  describe('POST /api/auth/login', () => {
    it('returns a token and user for valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.user.email).toBe(TEST_EMAIL);
      expect(res.body.user.password_hash).toBeUndefined();
    });

    it('rejects a wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_EMAIL, password: 'wrong-password' });

      expect(res.status).toBe(401);
    });

    it('rejects an unknown email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@survey-siswa.test', password: TEST_PASSWORD });

      expect(res.status).toBe(401);
    });

    it('rejects a missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_EMAIL });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('rejects requests without a token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('rejects an invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not-a-real-token');
      expect(res.status).toBe(401);
    });

    it('returns the current user for a valid token', async () => {
      const token = authService.generateToken(testUser);
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(TEST_EMAIL);
    });
  });
});

describe('authorize middleware', () => {
  function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  }

  it('calls next() when the user role is allowed', () => {
    const req = { user: { role: 'admin' } };
    const res = mockRes();
    const next = jest.fn();

    authorize('admin', 'guru')(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 403 when the user role is not allowed', () => {
    const req = { user: { role: 'siswa' } };
    const res = mockRes();
    const next = jest.fn();

    authorize('admin')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
