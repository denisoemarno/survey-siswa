const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');
const userModel = require('../src/models/user.model');
const authService = require('../src/services/auth.service');

const ADMIN_EMAIL = 'test-report-admin@survey-siswa.test';
const GURU_OWNER_EMAIL = 'test-report-guru-owner@survey-siswa.test';
const GURU_OTHER_EMAIL = 'test-report-guru-other@survey-siswa.test';
const SISWA_EMAIL_PREFIX = 'test-report-siswa-';
const PASSWORD = 'test-password-123';
const N_SISWA = 6;

async function makeUser(email, role, extra = {}) {
  await db('users').where({ email }).del();
  return userModel.create({
    nama: `Test ${role}`,
    email,
    password_hash: await authService.hashPassword(PASSWORD),
    role,
    ...extra,
  });
}

function periode() {
  const now = new Date();
  return {
    periode_mulai: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
    periode_selesai: new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString(),
  };
}

describe('Report / Aggregation endpoint', () => {
  let adminToken;
  let guruOwnerToken;
  let guruOwnerId;
  let guruOtherToken;
  let siswaTokens;
  const surveyIdsToClean = [];
  const siswaEmails = Array.from({ length: N_SISWA }, (_, i) => `${SISWA_EMAIL_PREFIX}${i}@survey-siswa.test`);

  beforeAll(async () => {
    const admin = await makeUser(ADMIN_EMAIL, 'admin');
    const guruOwner = await makeUser(GURU_OWNER_EMAIL, 'guru');
    const guruOther = await makeUser(GURU_OTHER_EMAIL, 'guru');
    const siswaUsers = await Promise.all(siswaEmails.map((email) => makeUser(email, 'siswa')));

    adminToken = authService.generateToken(admin);
    guruOwnerToken = authService.generateToken(guruOwner);
    guruOwnerId = guruOwner.id;
    guruOtherToken = authService.generateToken(guruOther);
    siswaTokens = siswaUsers.map((u) => authService.generateToken(u));
  });

  afterAll(async () => {
    for (const id of surveyIdsToClean) {
      await db('surveys').where({ id }).del();
    }
    await db('users').whereIn('email', [ADMIN_EMAIL, GURU_OWNER_EMAIL, GURU_OTHER_EMAIL, ...siswaEmails]).del();
    await db.destroy();
  });

  it('returns 404 for unknown survey', async () => {
    const res = await request(app)
      .get('/api/surveys/00000000-0000-0000-0000-000000000000/report')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it('rejects siswa role', async () => {
    const surveyRes = await request(app)
      .post('/api/surveys')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ judul: 'Report siswa reject test', tipe: 'kepuasan', ...periode() });
    surveyIdsToClean.push(surveyRes.body.survey.id);

    const res = await request(app)
      .get(`/api/surveys/${surveyRes.body.survey.id}/report`)
      .set('Authorization', `Bearer ${siswaTokens[0]}`);
    expect(res.status).toBe(403);
  });

  describe('Admin: full detail, no anonymity threshold', () => {
    let surveyId;
    let pilihanGandaId;

    beforeAll(async () => {
      const surveyRes = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ judul: 'Kepuasan Report Test', tipe: 'kepuasan', ...periode() });
      surveyId = surveyRes.body.survey.id;
      surveyIdsToClean.push(surveyId);

      const pg = await request(app)
        .post(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ teks_pertanyaan: 'Puas?', tipe_jawaban: 'pilihan_ganda', opsi: ['Ya', 'Tidak'], wajib: true });
      pilihanGandaId = pg.body.question.id;

      await request(app).post(`/api/surveys/${surveyId}/publish`).set('Authorization', `Bearer ${adminToken}`);
    });

    it('shows a report with zero responses (no anonymity gate for admin)', async () => {
      const res = await request(app)
        .get(`/api/surveys/${surveyId}/report`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.participation.total_responses).toBe(0);
      expect(res.body.message).toBeUndefined();
    });

    it('aggregates pilihan_ganda distribution correctly', async () => {
      const answers = ['Ya', 'Ya', 'Tidak'];
      for (let i = 0; i < answers.length; i++) {
        await request(app)
          .post(`/api/surveys/${surveyId}/responses`)
          .set('Authorization', `Bearer ${siswaTokens[i]}`)
          .send({ answers: [{ question_id: pilihanGandaId, jawaban: answers[i] }] });
      }

      const res = await request(app)
        .get(`/api/surveys/${surveyId}/report`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.participation.total_responses).toBe(3);

      const question = res.body.questions.find((q) => q.id === pilihanGandaId);
      const ya = question.distribusi.find((d) => d.opsi === 'Ya');
      const tidak = question.distribusi.find((d) => d.opsi === 'Tidak');
      expect(ya.count).toBe(2);
      expect(tidak.count).toBe(1);
    });
  });

  describe('Guru: anonymity threshold', () => {
    let surveyId;
    let skalaId;

    beforeAll(async () => {
      const surveyRes = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          judul: 'Evaluasi Guru Owner',
          tipe: 'evaluasi_guru',
          guru_id: guruOwnerId,
          ...periode(),
        });
      surveyId = surveyRes.body.survey.id;
      surveyIdsToClean.push(surveyId);

      const skala = await request(app)
        .post(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ teks_pertanyaan: 'Nilai pengajaran (1-5)?', tipe_jawaban: 'skala', wajib: true });
      skalaId = skala.body.question.id;

      await request(app).post(`/api/surveys/${surveyId}/publish`).set('Authorization', `Bearer ${adminToken}`);
    });

    it('rejects a guru who does not own the survey', async () => {
      const res = await request(app)
        .get(`/api/surveys/${surveyId}/report`)
        .set('Authorization', `Bearer ${guruOtherToken}`);
      expect(res.status).toBe(403);
    });

    it('hides aggregate below the anonymity threshold', async () => {
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post(`/api/surveys/${surveyId}/responses`)
          .set('Authorization', `Bearer ${siswaTokens[i]}`)
          .send({ answers: [{ question_id: skalaId, jawaban: 5 }] });
      }

      const res = await request(app)
        .get(`/api/surveys/${surveyId}/report`)
        .set('Authorization', `Bearer ${guruOwnerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Data belum cukup untuk ditampilkan');
      expect(res.body.questions).toBeUndefined();
    });

    it('shows aggregate once the threshold is met', async () => {
      for (let i = 3; i < N_SISWA; i++) {
        await request(app)
          .post(`/api/surveys/${surveyId}/responses`)
          .set('Authorization', `Bearer ${siswaTokens[i]}`)
          .send({ answers: [{ question_id: skalaId, jawaban: 3 }] });
      }

      const res = await request(app)
        .get(`/api/surveys/${surveyId}/report`)
        .set('Authorization', `Bearer ${guruOwnerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBeUndefined();
      expect(res.body.participation.total_responses).toBe(N_SISWA);

      const question = res.body.questions.find((q) => q.id === skalaId);
      expect(question.rata_rata).toBeCloseTo((5 * 3 + 3 * 3) / N_SISWA, 2);
    });
  });
});
