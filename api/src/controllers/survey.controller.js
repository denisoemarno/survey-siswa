const surveyModel = require('../models/survey.model');
const questionModel = require('../models/question.model');
const userModel = require('../models/user.model');
const { SURVEY_TYPES } = require('../constants/surveys');

const PG_FOREIGN_KEY_VIOLATION = '23503';

async function validateGuru(tipe, guru_id) {
  if (tipe === 'evaluasi_guru') {
    if (!guru_id) return 'guru_id wajib diisi untuk survey tipe evaluasi_guru';
    const guru = await userModel.findById(guru_id);
    if (!guru || guru.role !== 'guru') return 'guru_id tidak valid atau bukan user dengan role guru';
    return null;
  }
  if (guru_id) return 'guru_id hanya boleh diisi untuk survey tipe evaluasi_guru';
  return null;
}

async function list(req, res, next) {
  try {
    const { tipe, status } = req.query;
    const surveys = await surveyModel.list({ tipe, status });
    res.json({ surveys });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { judul, tipe, deskripsi, target_kelas, target_angkatan, guru_id, periode_mulai, periode_selesai } = req.body;

    if (!judul || !tipe || !periode_mulai || !periode_selesai) {
      return res.status(400).json({
        error: { message: 'judul, tipe, periode_mulai, dan periode_selesai wajib diisi' },
      });
    }
    if (!SURVEY_TYPES.includes(tipe)) {
      return res.status(400).json({ error: { message: `tipe harus salah satu dari: ${SURVEY_TYPES.join(', ')}` } });
    }
    if (new Date(periode_mulai) >= new Date(periode_selesai)) {
      return res.status(400).json({ error: { message: 'periode_mulai harus sebelum periode_selesai' } });
    }

    const guruError = await validateGuru(tipe, guru_id);
    if (guruError) {
      return res.status(400).json({ error: { message: guruError } });
    }

    const survey = await surveyModel.create({
      judul,
      tipe,
      deskripsi,
      target_kelas,
      target_angkatan,
      guru_id: tipe === 'evaluasi_guru' ? guru_id : null,
      periode_mulai,
      periode_selesai,
      status: 'draft',
      created_by: req.user.sub,
    });
    res.status(201).json({ survey });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const survey = await surveyModel.findById(req.params.id);
    if (!survey) {
      return res.status(404).json({ error: { message: 'Survey tidak ditemukan' } });
    }
    const questions = await questionModel.listBySurvey(survey.id);
    res.json({ survey, questions });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const survey = await surveyModel.findById(req.params.id);
    if (!survey) {
      return res.status(404).json({ error: { message: 'Survey tidak ditemukan' } });
    }
    if (survey.status !== 'draft') {
      return res.status(409).json({ error: { message: 'Survey hanya bisa diubah saat berstatus draft' } });
    }

    const { judul, tipe, deskripsi, target_kelas, target_angkatan, guru_id, periode_mulai, periode_selesai } = req.body;
    const effectiveTipe = tipe || survey.tipe;

    if (tipe && !SURVEY_TYPES.includes(tipe)) {
      return res.status(400).json({ error: { message: `tipe harus salah satu dari: ${SURVEY_TYPES.join(', ')}` } });
    }
    if (periode_mulai && periode_selesai && new Date(periode_mulai) >= new Date(periode_selesai)) {
      return res.status(400).json({ error: { message: 'periode_mulai harus sebelum periode_selesai' } });
    }

    const guruError = await validateGuru(effectiveTipe, guru_id !== undefined ? guru_id : survey.guru_id);
    if (guruError) {
      return res.status(400).json({ error: { message: guruError } });
    }

    const fields = { judul, tipe, deskripsi, target_kelas, target_angkatan, guru_id, periode_mulai, periode_selesai };
    if (effectiveTipe !== 'evaluasi_guru') fields.guru_id = null;
    Object.keys(fields).forEach((key) => fields[key] === undefined && delete fields[key]);

    const updated = await surveyModel.update(req.params.id, fields);
    res.json({ survey: updated });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const survey = await surveyModel.findById(req.params.id);
    if (!survey) {
      return res.status(404).json({ error: { message: 'Survey tidak ditemukan' } });
    }
    if (survey.status !== 'draft') {
      return res.status(409).json({ error: { message: 'Survey hanya bisa dihapus saat berstatus draft' } });
    }
    await surveyModel.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    if (err.code === PG_FOREIGN_KEY_VIOLATION) {
      return res.status(409).json({ error: { message: 'Survey tidak bisa dihapus karena masih terkait data lain' } });
    }
    next(err);
  }
}

async function publish(req, res, next) {
  try {
    const survey = await surveyModel.findById(req.params.id);
    if (!survey) {
      return res.status(404).json({ error: { message: 'Survey tidak ditemukan' } });
    }
    if (survey.status !== 'draft') {
      return res.status(409).json({ error: { message: 'Hanya survey berstatus draft yang bisa dipublish' } });
    }
    const questionCount = await questionModel.countBySurvey(survey.id);
    if (questionCount < 1) {
      return res.status(400).json({ error: { message: 'Survey harus punya minimal 1 pertanyaan sebelum dipublish' } });
    }
    const updated = await surveyModel.update(req.params.id, { status: 'published' });
    res.json({ survey: updated });
  } catch (err) {
    next(err);
  }
}

async function close(req, res, next) {
  try {
    const survey = await surveyModel.findById(req.params.id);
    if (!survey) {
      return res.status(404).json({ error: { message: 'Survey tidak ditemukan' } });
    }
    if (survey.status !== 'published') {
      return res.status(409).json({ error: { message: 'Hanya survey berstatus published yang bisa ditutup' } });
    }
    const updated = await surveyModel.update(req.params.id, { status: 'closed' });
    res.json({ survey: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, getById, update, remove, publish, close };
