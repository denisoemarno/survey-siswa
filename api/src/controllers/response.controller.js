const db = require('../config/db');
const surveyModel = require('../models/survey.model');
const questionModel = require('../models/question.model');
const responseModel = require('../models/response.model');
const answerModel = require('../models/answer.model');
const userModel = require('../models/user.model');

function validateAnswerForQuestion(question, rawAnswer) {
  const hasAnswer = rawAnswer !== undefined && rawAnswer !== null && rawAnswer !== '';

  if (!hasAnswer) {
    if (question.wajib) {
      return { error: `Pertanyaan "${question.teks_pertanyaan}" wajib dijawab` };
    }
    return { skip: true };
  }

  if (question.tipe_jawaban === 'pilihan_ganda') {
    const opsi = question.opsi || [];
    if (!opsi.includes(rawAnswer)) {
      return { error: `Jawaban untuk "${question.teks_pertanyaan}" harus salah satu dari opsi yang tersedia` };
    }
    return { row: { jawaban_pilihan: rawAnswer } };
  }

  if (question.tipe_jawaban === 'skala') {
    const num = Number(rawAnswer);
    if (!Number.isInteger(num) || num < 1 || num > 5) {
      return { error: `Jawaban untuk "${question.teks_pertanyaan}" harus berupa angka 1-5` };
    }
    return { row: { jawaban_skala: num } };
  }

  return { row: { jawaban_teks: String(rawAnswer) } };
}

async function status(req, res, next) {
  try {
    const survey = await surveyModel.findById(req.params.surveyId);
    if (!survey) {
      return res.status(404).json({ error: { message: 'Survey tidak ditemukan' } });
    }
    const existing = await responseModel.findBySurveyAndSiswa(survey.id, req.user.sub);
    res.json({ submitted: !!existing, submitted_at: existing ? existing.submitted_at : null });
  } catch (err) {
    next(err);
  }
}

async function submit(req, res, next) {
  try {
    const survey = await surveyModel.findById(req.params.surveyId);
    if (!survey) {
      return res.status(404).json({ error: { message: 'Survey tidak ditemukan' } });
    }
    if (survey.status !== 'published') {
      return res.status(409).json({ error: { message: 'Survey belum atau tidak lagi bisa diisi' } });
    }

    const now = new Date();
    if (now < new Date(survey.periode_mulai) || now > new Date(survey.periode_selesai)) {
      return res.status(409).json({ error: { message: 'Survey diluar periode pengisian' } });
    }

    const siswa = await userModel.findById(req.user.sub);
    if (survey.target_kelas && siswa.kelas !== survey.target_kelas) {
      return res.status(403).json({ error: { message: 'Survey ini tidak ditargetkan untuk kelas anda' } });
    }
    if (survey.target_angkatan && siswa.angkatan !== survey.target_angkatan) {
      return res.status(403).json({ error: { message: 'Survey ini tidak ditargetkan untuk angkatan anda' } });
    }

    const existing = await responseModel.findBySurveyAndSiswa(survey.id, req.user.sub);
    if (existing) {
      return res.status(409).json({ error: { message: 'Anda sudah pernah mengisi survey ini' } });
    }

    const { answers } = req.body;
    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: { message: 'answers wajib berupa array {question_id, jawaban}' } });
    }

    const questions = await questionModel.listBySurvey(survey.id);
    const validQuestionIds = new Set(questions.map((q) => q.id));
    const answerByQuestionId = new Map(answers.map((a) => [a.question_id, a.jawaban]));

    for (const a of answers) {
      if (!validQuestionIds.has(a.question_id)) {
        return res.status(400).json({ error: { message: `question_id ${a.question_id} tidak valid untuk survey ini` } });
      }
    }

    const answerRows = [];
    for (const question of questions) {
      const result = validateAnswerForQuestion(question, answerByQuestionId.get(question.id));
      if (result.error) {
        return res.status(400).json({ error: { message: result.error } });
      }
      if (result.skip) continue;
      answerRows.push({ question_id: question.id, ...result.row });
    }

    const response = await db.transaction(async (trx) => {
      const createdResponse = await responseModel.create(trx, { survey_id: survey.id, siswa_id: req.user.sub });
      await answerModel.bulkCreate(
        trx,
        answerRows.map((row) => ({ ...row, response_id: createdResponse.id }))
      );
      return createdResponse;
    });

    res.status(201).json({ response, answers_count: answerRows.length });
  } catch (err) {
    next(err);
  }
}

module.exports = { status, submit };
