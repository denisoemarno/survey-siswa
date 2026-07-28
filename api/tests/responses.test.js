const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');
const userModel = require('../src/models/user.model');
const authService = require('../src/services/auth.service');

const ADMIN_EMAIL = 'test-responses-admin@survey-siswa.test';
const SISWA_EMAIL = 'test-responses-siswa@survey-siswa.test';
const SISWA_OTHER_KELAS_EMAIL = 'test-responses-siswa-other@survey-siswa.test';
const PASSWORD = 'test-password-123';

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

async function createPublishedSurvey(adminToken, { periode_mulai, periode_selesai } = {}) {
  const now = new Date();
  const surveyRes = await request(app)
    .post('/api/surveys')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      judul: 'Survey Kepuasan Kelas 10 IPA 1',
      tipe: 'kepuasan',
      target_kelas: '10 IPA 1',
      target_angkatan: 2026,
      periode_mulai: periode_mulai || new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
      periode_selesai: periode_selesai || new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString(),
    });
  const surveyId = surveyRes.body.survey.id;

  const pg = await request(app)
    .post(`/api/surveys/${surveyId}/questions`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ teks_pertanyaan: 'Apakah anda puas?', tipe_jawaban: 'pilihan_ganda', opsi: ['Ya', 'Tidak'], wajib: true });

  const skala = await request(app)
    .post(`/api/surveys/${surveyId}/questions`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ teks_pertanyaan: 'Seberapa puas (1-5)?', tipe_jawaban: 'skala', wajib: true });

  await request(app)
    .post(`/api/surveys/${surveyId}/questions`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ teks_pertanyaan: 'Saran?', tipe_jawaban: 'essay', wajib: false });

  await request(app).post(`/api/surveys/${surveyId}/publish`).set('Authorization', `Bearer ${adminToken}`);

  return { surveyId, pilihanGandaId: pg.body.question.id, skalaId: skala.body.question.id };
}

describe('Response & Answer submission (Siswa)', () => {
  let adminToken;
  let siswaToken;
  let siswaOtherKelasToken;
  const surveyIdsToClean = [];

  beforeAll(async () => {
    const admin = await makeUser(ADMIN_EMAIL, 'admin');
    const siswa = await makeUser(SISWA_EMAIL, 'siswa', { kelas: '10 IPA 1', angkatan: 2026 });
    const siswaOther = await makeUser(SISWA_OTHER_KELAS_EMAIL, 'siswa', { kelas: '10 IPA 2', angkatan: 2026 });

    adminToken = authService.generateToken(admin);
    siswaToken = authService.generateToken(siswa);
    siswaOtherKelasToken = authService.generateToken(siswaOther);
  });

  afterAll(async () => {
    for (const id of surveyIdsToClean) {
      await db('surveys').where({ id }).del();
    }
    await db('users')
      .whereIn('email', [ADMIN_EMAIL, SISWA_EMAIL, SISWA_OTHER_KELAS_EMAIL, 'test-responses-racer@survey-siswa.test'])
      .del();
    await db.destroy();
  });

  it('rejects non-siswa role', async () => {
    const { surveyId } = await createPublishedSurvey(adminToken);
    surveyIdsToClean.push(surveyId);

    const res = await request(app)
      .get(`/api/surveys/${surveyId}/responses/me`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(403);
  });

  it('returns not-submitted status before submission', async () => {
    const { surveyId } = await createPublishedSurvey(adminToken);
    surveyIdsToClean.push(surveyId);

    const res = await request(app)
      .get(`/api/surveys/${surveyId}/responses/me`)
      .set('Authorization', `Bearer ${siswaToken}`);
    expect(res.status).toBe(200);
    expect(res.body.submitted).toBe(false);
  });

  it('rejects submission for unknown survey', async () => {
    const res = await request(app)
      .post('/api/surveys/00000000-0000-0000-0000-000000000000/responses')
      .set('Authorization', `Bearer ${siswaToken}`)
      .send({ answers: [] });
    expect(res.status).toBe(404);
  });

  it('rejects submission for a draft (unpublished) survey', async () => {
    const draftRes = await request(app)
      .post('/api/surveys')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        judul: 'Masih draft',
        tipe: 'kepuasan',
        periode_mulai: '2026-08-01T00:00:00.000Z',
        periode_selesai: '2026-08-31T00:00:00.000Z',
      });
    surveyIdsToClean.push(draftRes.body.survey.id);

    const res = await request(app)
      .post(`/api/surveys/${draftRes.body.survey.id}/responses`)
      .set('Authorization', `Bearer ${siswaToken}`)
      .send({ answers: [] });
    expect(res.status).toBe(409);
  });

  it('rejects submission outside the periode window', async () => {
    const { surveyId } = await createPublishedSurvey(adminToken, {
      periode_mulai: '2020-01-01T00:00:00.000Z',
      periode_selesai: '2020-01-31T00:00:00.000Z',
    });
    surveyIdsToClean.push(surveyId);

    const res = await request(app)
      .post(`/api/surveys/${surveyId}/responses`)
      .set('Authorization', `Bearer ${siswaToken}`)
      .send({ answers: [] });
    expect(res.status).toBe(409);
  });

  it('rejects a siswa outside the target kelas', async () => {
    const { surveyId } = await createPublishedSurvey(adminToken);
    surveyIdsToClean.push(surveyId);

    const res = await request(app)
      .post(`/api/surveys/${surveyId}/responses`)
      .set('Authorization', `Bearer ${siswaOtherKelasToken}`)
      .send({ answers: [] });
    expect(res.status).toBe(403);
  });

  it('rejects a missing required answer', async () => {
    const { surveyId, skalaId } = await createPublishedSurvey(adminToken);
    surveyIdsToClean.push(surveyId);

    const res = await request(app)
      .post(`/api/surveys/${surveyId}/responses`)
      .set('Authorization', `Bearer ${siswaToken}`)
      .send({ answers: [{ question_id: skalaId, jawaban: 4 }] });
    expect(res.status).toBe(400);
  });

  it('rejects an invalid pilihan_ganda value', async () => {
    const { surveyId, pilihanGandaId, skalaId } = await createPublishedSurvey(adminToken);
    surveyIdsToClean.push(surveyId);

    const res = await request(app)
      .post(`/api/surveys/${surveyId}/responses`)
      .set('Authorization', `Bearer ${siswaToken}`)
      .send({
        answers: [
          { question_id: pilihanGandaId, jawaban: 'Mungkin' },
          { question_id: skalaId, jawaban: 4 },
        ],
      });
    expect(res.status).toBe(400);
  });

  it('rejects an out-of-range skala value', async () => {
    const { surveyId, pilihanGandaId, skalaId } = await createPublishedSurvey(adminToken);
    surveyIdsToClean.push(surveyId);

    const res = await request(app)
      .post(`/api/surveys/${surveyId}/responses`)
      .set('Authorization', `Bearer ${siswaToken}`)
      .send({
        answers: [
          { question_id: pilihanGandaId, jawaban: 'Ya' },
          { question_id: skalaId, jawaban: 6 },
        ],
      });
    expect(res.status).toBe(400);
  });

  it('rejects an unknown question_id', async () => {
    const { surveyId, pilihanGandaId, skalaId } = await createPublishedSurvey(adminToken);
    surveyIdsToClean.push(surveyId);

    const res = await request(app)
      .post(`/api/surveys/${surveyId}/responses`)
      .set('Authorization', `Bearer ${siswaToken}`)
      .send({
        answers: [
          { question_id: pilihanGandaId, jawaban: 'Ya' },
          { question_id: skalaId, jawaban: 4 },
          { question_id: '00000000-0000-0000-0000-000000000000', jawaban: 'x' },
        ],
      });
    expect(res.status).toBe(400);
  });

  it('accepts a valid full submission, then blocks status check and re-submission', async () => {
    const { surveyId, pilihanGandaId, skalaId } = await createPublishedSurvey(adminToken);
    surveyIdsToClean.push(surveyId);

    const submitRes = await request(app)
      .post(`/api/surveys/${surveyId}/responses`)
      .set('Authorization', `Bearer ${siswaToken}`)
      .send({
        answers: [
          { question_id: pilihanGandaId, jawaban: 'Ya' },
          { question_id: skalaId, jawaban: 5 },
        ],
      });
    expect(submitRes.status).toBe(201);
    expect(submitRes.body.answers_count).toBe(2);

    const statusRes = await request(app)
      .get(`/api/surveys/${surveyId}/responses/me`)
      .set('Authorization', `Bearer ${siswaToken}`);
    expect(statusRes.body.submitted).toBe(true);

    const resubmitRes = await request(app)
      .post(`/api/surveys/${surveyId}/responses`)
      .set('Authorization', `Bearer ${siswaToken}`)
      .send({
        answers: [
          { question_id: pilihanGandaId, jawaban: 'Ya' },
          { question_id: skalaId, jawaban: 5 },
        ],
      });
    expect(resubmitRes.status).toBe(409);
  });

  it('lets exactly one of several concurrent first-time submissions succeed', async () => {
    const { surveyId, pilihanGandaId, skalaId } = await createPublishedSurvey(adminToken);
    surveyIdsToClean.push(surveyId);

    const racer = await makeUser('test-responses-racer@survey-siswa.test', 'siswa', {
      kelas: '10 IPA 1',
      angkatan: 2026,
    });
    const racerToken = authService.generateToken(racer);

    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        request(app)
          .post(`/api/surveys/${surveyId}/responses`)
          .set('Authorization', `Bearer ${racerToken}`)
          .send({
            answers: [
              { question_id: pilihanGandaId, jawaban: 'Ya' },
              { question_id: skalaId, jawaban: 5 },
            ],
          })
      )
    );

    const statuses = results.map((r) => r.status);
    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(4);
    expect(statuses.every((s) => s === 201 || s === 409)).toBe(true);
  });
});
