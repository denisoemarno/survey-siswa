const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');
const userModel = require('../src/models/user.model');
const authService = require('../src/services/auth.service');

const ADMIN_EMAIL = 'test-surveys-admin@survey-siswa.test';
const GURU_EMAIL = 'test-surveys-guru@survey-siswa.test';
const SISWA_EMAIL = 'test-surveys-siswa@survey-siswa.test';
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

function periode() {
  return {
    periode_mulai: '2026-08-01T00:00:00.000Z',
    periode_selesai: '2026-08-31T00:00:00.000Z',
  };
}

describe('Surveys & Questions CRUD (Admin only)', () => {
  let adminToken;
  let siswaToken;
  let guru;
  const surveyIdsToClean = [];

  beforeAll(async () => {
    const admin = await makeUser(ADMIN_EMAIL, 'admin');
    guru = await makeUser(GURU_EMAIL, 'guru');
    const siswa = await makeUser(SISWA_EMAIL, 'siswa');

    adminToken = authService.generateToken(admin);
    siswaToken = authService.generateToken(siswa);
  });

  afterAll(async () => {
    for (const id of surveyIdsToClean) {
      await db('surveys').where({ id }).del();
    }
    await db('users').whereIn('email', [ADMIN_EMAIL, GURU_EMAIL, SISWA_EMAIL]).del();
  });

  describe('POST /api/surveys', () => {
    it('rejects non-admin', async () => {
      const res = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${siswaToken}`)
        .send({ judul: 'X', tipe: 'kepuasan', ...periode() });
      expect(res.status).toBe(403);
    });

    it('rejects missing fields', async () => {
      const res = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ judul: 'X' });
      expect(res.status).toBe(400);
    });

    it('rejects invalid tipe', async () => {
      const res = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ judul: 'X', tipe: 'invalid', ...periode() });
      expect(res.status).toBe(400);
    });

    it('rejects evaluasi_guru without guru_id', async () => {
      const res = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ judul: 'Evaluasi Guru X', tipe: 'evaluasi_guru', ...periode() });
      expect(res.status).toBe(400);
    });

    it('rejects guru_id pointing to a non-guru user', async () => {
      const siswa = await db('users').where({ email: SISWA_EMAIL }).first();
      const res = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ judul: 'Evaluasi Guru X', tipe: 'evaluasi_guru', guru_id: siswa.id, ...periode() });
      expect(res.status).toBe(400);
    });

    it('creates a kepuasan survey as draft', async () => {
      const res = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ judul: 'Kepuasan Fasilitas 2026', tipe: 'kepuasan', ...periode() });
      expect(res.status).toBe(201);
      expect(res.body.survey.status).toBe('draft');
      surveyIdsToClean.push(res.body.survey.id);
    });

    it('creates an evaluasi_guru survey with a valid guru', async () => {
      const res = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ judul: 'Evaluasi Pak Guru', tipe: 'evaluasi_guru', guru_id: guru.id, ...periode() });
      expect(res.status).toBe(201);
      expect(res.body.survey.guru_id).toBe(guru.id);
      surveyIdsToClean.push(res.body.survey.id);
    });
  });

  describe('Survey lifecycle: draft -> published -> closed', () => {
    let surveyId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ judul: 'Lifecycle Test Survey', tipe: 'kepuasan', ...periode() });
      surveyId = res.body.survey.id;
      surveyIdsToClean.push(surveyId);
    });

    it('rejects publish without any question', async () => {
      const res = await request(app)
        .post(`/api/surveys/${surveyId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
    });

    it('rejects question with pilihan_ganda but no opsi', async () => {
      const res = await request(app)
        .post(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ teks_pertanyaan: 'Bagaimana?', tipe_jawaban: 'pilihan_ganda' });
      expect(res.status).toBe(400);
    });

    it('adds questions of each type', async () => {
      const pg = await request(app)
        .post(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ teks_pertanyaan: 'Pilih salah satu', tipe_jawaban: 'pilihan_ganda', opsi: ['A', 'B'] });
      expect(pg.status).toBe(201);

      const skala = await request(app)
        .post(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ teks_pertanyaan: 'Seberapa puas (1-5)?', tipe_jawaban: 'skala' });
      expect(skala.status).toBe(201);

      const essay = await request(app)
        .post(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ teks_pertanyaan: 'Saran?', tipe_jawaban: 'essay' });
      expect(essay.status).toBe(201);

      const list = await request(app)
        .get(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(list.body.questions).toHaveLength(3);
    });

    it('publishes once at least one question exists', async () => {
      const res = await request(app)
        .post(`/api/surveys/${surveyId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.survey.status).toBe('published');
    });

    it('rejects updating a published survey', async () => {
      const res = await request(app)
        .put(`/api/surveys/${surveyId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ judul: 'Berubah' });
      expect(res.status).toBe(409);
    });

    it('rejects adding a question to a published survey', async () => {
      const res = await request(app)
        .post(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ teks_pertanyaan: 'Tambahan?', tipe_jawaban: 'essay' });
      expect(res.status).toBe(409);
    });

    it('rejects deleting a published survey', async () => {
      const res = await request(app)
        .delete(`/api/surveys/${surveyId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(409);
    });

    it('rejects closing before published (separate draft survey)', async () => {
      const draft = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ judul: 'Draft only', tipe: 'kepuasan', ...periode() });
      surveyIdsToClean.push(draft.body.survey.id);

      const res = await request(app)
        .post(`/api/surveys/${draft.body.survey.id}/close`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(409);
    });

    it('closes a published survey', async () => {
      const res = await request(app)
        .post(`/api/surveys/${surveyId}/close`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.survey.status).toBe('closed');
    });
  });

  describe('GET /api/surveys/:id', () => {
    it('returns 404 for unknown survey', async () => {
      const res = await request(app)
        .get('/api/surveys/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PUT/DELETE /api/questions/:id', () => {
    let surveyId;
    let questionId;

    beforeAll(async () => {
      const surveyRes = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ judul: 'Question edit test', tipe: 'kepuasan', ...periode() });
      surveyId = surveyRes.body.survey.id;
      surveyIdsToClean.push(surveyId);

      const questionRes = await request(app)
        .post(`/api/surveys/${surveyId}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ teks_pertanyaan: 'Awal', tipe_jawaban: 'essay' });
      questionId = questionRes.body.question.id;
    });

    it('updates a question while survey is draft', async () => {
      const res = await request(app)
        .put(`/api/questions/${questionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ teks_pertanyaan: 'Sudah diubah' });
      expect(res.status).toBe(200);
      expect(res.body.question.teks_pertanyaan).toBe('Sudah diubah');
    });

    it('deletes a question while survey is draft', async () => {
      const res = await request(app)
        .delete(`/api/questions/${questionId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(204);
    });
  });
});

describe('Siswa-scoped survey visibility', () => {
  const ADMIN2_EMAIL = 'test-surveys-scope-admin@survey-siswa.test';
  const SISWA_MATCH_EMAIL = 'test-surveys-scope-siswa-match@survey-siswa.test';
  const SISWA_OTHER_EMAIL = 'test-surveys-scope-siswa-other@survey-siswa.test';

  let adminToken;
  let siswaMatchToken;
  let siswaOtherToken;
  const surveyIdsToClean = [];
  let targetedSurveyId;
  let draftSurveyId;

  beforeAll(async () => {
    const admin = await makeUser(ADMIN2_EMAIL, 'admin');
    const siswaMatch = await makeUser(SISWA_MATCH_EMAIL, 'siswa');
    await db('users').where({ id: siswaMatch.id }).update({ kelas: '10 IPA 1', angkatan: 2026 });
    const siswaOther = await makeUser(SISWA_OTHER_EMAIL, 'siswa');
    await db('users').where({ id: siswaOther.id }).update({ kelas: '10 IPA 2', angkatan: 2026 });

    adminToken = authService.generateToken(admin);
    siswaMatchToken = authService.generateToken(siswaMatch);
    siswaOtherToken = authService.generateToken(siswaOther);

    const targeted = await request(app)
      .post('/api/surveys')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ judul: 'Targeted for 10 IPA 1', tipe: 'kepuasan', target_kelas: '10 IPA 1', ...periode() });
    targetedSurveyId = targeted.body.survey.id;
    surveyIdsToClean.push(targetedSurveyId);

    await request(app)
      .post(`/api/surveys/${targetedSurveyId}/questions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ teks_pertanyaan: 'Puas?', tipe_jawaban: 'essay', wajib: false });

    await request(app).post(`/api/surveys/${targetedSurveyId}/publish`).set('Authorization', `Bearer ${adminToken}`);

    const draft = await request(app)
      .post('/api/surveys')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ judul: 'Still draft', tipe: 'kepuasan', target_kelas: '10 IPA 1', ...periode() });
    draftSurveyId = draft.body.survey.id;
    surveyIdsToClean.push(draftSurveyId);
  });

  afterAll(async () => {
    for (const id of surveyIdsToClean) {
      await db('surveys').where({ id }).del();
    }
    await db('users').whereIn('email', [ADMIN2_EMAIL, SISWA_MATCH_EMAIL, SISWA_OTHER_EMAIL]).del();
  });

  it('lists only published surveys matching the siswa target_kelas', async () => {
    const res = await request(app).get('/api/surveys').set('Authorization', `Bearer ${siswaMatchToken}`);
    expect(res.status).toBe(200);
    const ids = res.body.surveys.map((s) => s.id);
    expect(ids).toContain(targetedSurveyId);
    expect(ids).not.toContain(draftSurveyId);
    expect(res.body.surveys.find((s) => s.id === targetedSurveyId).submitted).toBe(false);
  });

  it('excludes surveys targeted at a different kelas', async () => {
    const res = await request(app).get('/api/surveys').set('Authorization', `Bearer ${siswaOtherToken}`);
    expect(res.status).toBe(200);
    expect(res.body.surveys.map((s) => s.id)).not.toContain(targetedSurveyId);
  });

  it('allows a matching siswa to view survey detail + questions', async () => {
    const res = await request(app)
      .get(`/api/surveys/${targetedSurveyId}`)
      .set('Authorization', `Bearer ${siswaMatchToken}`);
    expect(res.status).toBe(200);
    expect(res.body.questions.length).toBeGreaterThan(0);
  });

  it('rejects a non-matching siswa viewing survey detail', async () => {
    const res = await request(app)
      .get(`/api/surveys/${targetedSurveyId}`)
      .set('Authorization', `Bearer ${siswaOtherToken}`);
    expect(res.status).toBe(403);
  });

  it('rejects a siswa viewing a draft survey', async () => {
    const res = await request(app)
      .get(`/api/surveys/${draftSurveyId}`)
      .set('Authorization', `Bearer ${siswaMatchToken}`);
    expect(res.status).toBe(403);
  });
});

afterAll(async () => {
  await db.destroy();
});
