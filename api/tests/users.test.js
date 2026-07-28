const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');
const userModel = require('../src/models/user.model');
const authService = require('../src/services/auth.service');

const ADMIN_EMAIL = 'test-users-admin@survey-siswa.test';
const SISWA_A_EMAIL = 'test-users-siswa-a@survey-siswa.test';
const SISWA_B_EMAIL = 'test-users-siswa-b@survey-siswa.test';
const PASSWORD = 'test-password-123';

async function makeUser(email, role) {
  await db('users').where({ email }).del();
  return userModel.create({
    nama: `Test ${role}`,
    email,
    password_hash: await authService.hashPassword(PASSWORD),
    role,
  });
}

describe('Users CRUD (Admin only)', () => {
  let adminToken;
  let siswaA;
  let siswaAToken;
  let siswaBToken;

  beforeAll(async () => {
    const admin = await makeUser(ADMIN_EMAIL, 'admin');
    siswaA = await makeUser(SISWA_A_EMAIL, 'siswa');
    const siswaB = await makeUser(SISWA_B_EMAIL, 'siswa');

    adminToken = authService.generateToken(admin);
    siswaAToken = authService.generateToken(siswaA);
    siswaBToken = authService.generateToken(siswaB);
  });

  afterAll(async () => {
    await db('users')
      .whereIn('email', [ADMIN_EMAIL, SISWA_A_EMAIL, SISWA_B_EMAIL, 'test-users-created@survey-siswa.test'])
      .del();
    await db.destroy();
  });

  describe('GET /api/users', () => {
    it('rejects non-admin', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${siswaAToken}`);
      expect(res.status).toBe(403);
    });

    it('lists users for admin', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users.some((u) => u.email === SISWA_A_EMAIL)).toBe(true);
      expect(res.body.users[0].password_hash).toBeUndefined();
    });

    it('filters by role', async () => {
      const res = await request(app)
        .get('/api/users?role=admin')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.users.every((u) => u.role === 'admin')).toBe(true);
    });
  });

  describe('POST /api/users', () => {
    it('creates a user as admin', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nama: 'Test Created',
          email: 'test-users-created@survey-siswa.test',
          password: PASSWORD,
          role: 'siswa',
          kelas: '10 IPA 1',
        });
      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe('test-users-created@survey-siswa.test');
      expect(res.body.user.password_hash).toBeUndefined();
    });

    it('rejects duplicate email', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nama: 'Dup', email: SISWA_A_EMAIL, password: PASSWORD, role: 'siswa' });
      expect(res.status).toBe(409);
    });

    it('rejects invalid role', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nama: 'Invalid', email: 'x@survey-siswa.test', password: PASSWORD, role: 'kepsek' });
      expect(res.status).toBe(400);
    });

    it('rejects missing fields', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'x@survey-siswa.test' });
      expect(res.status).toBe(400);
    });

    it('rejects non-admin', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${siswaAToken}`)
        .send({ nama: 'X', email: 'x2@survey-siswa.test', password: PASSWORD, role: 'siswa' });
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/users/:id', () => {
    it('allows a user to view their own record', async () => {
      const res = await request(app)
        .get(`/api/users/${siswaA.id}`)
        .set('Authorization', `Bearer ${siswaAToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(SISWA_A_EMAIL);
    });

    it('rejects viewing another user record', async () => {
      const res = await request(app)
        .get(`/api/users/${siswaA.id}`)
        .set('Authorization', `Bearer ${siswaBToken}`);
      expect(res.status).toBe(403);
    });

    it('allows admin to view any record', async () => {
      const res = await request(app)
        .get(`/api/users/${siswaA.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('updates a user as admin', async () => {
      const res = await request(app)
        .put(`/api/users/${siswaA.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ kelas: '11 IPA 2' });
      expect(res.status).toBe(200);
      expect(res.body.user.kelas).toBe('11 IPA 2');
    });

    it('rejects non-admin', async () => {
      const res = await request(app)
        .put(`/api/users/${siswaA.id}`)
        .set('Authorization', `Bearer ${siswaAToken}`)
        .send({ kelas: '12 IPA 3' });
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('deletes a user as admin', async () => {
      const toDelete = await makeUser('test-users-to-delete@survey-siswa.test', 'siswa');
      const res = await request(app)
        .delete(`/api/users/${toDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(204);

      const check = await userModel.findById(toDelete.id);
      expect(check).toBeUndefined();
    });

    it('rejects non-admin', async () => {
      const res = await request(app)
        .delete(`/api/users/${siswaA.id}`)
        .set('Authorization', `Bearer ${siswaAToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/users/import', () => {
    it('imports valid rows and reports failures', async () => {
      const csv = [
        'nama,email,password,role,kelas',
        `Import Ok,test-users-import-ok@survey-siswa.test,${PASSWORD},siswa,10 IPA 1`,
        `Import Bad Role,test-users-import-bad@survey-siswa.test,${PASSWORD},kepsek,10 IPA 1`,
      ].join('\n');

      const res = await request(app)
        .post('/api/users/import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ csv });

      expect(res.status).toBe(201);
      expect(res.body.created).toHaveLength(1);
      expect(res.body.failed).toHaveLength(1);

      await db('users')
        .whereIn('email', ['test-users-import-ok@survey-siswa.test', 'test-users-import-bad@survey-siswa.test'])
        .del();
    });
  });
});
