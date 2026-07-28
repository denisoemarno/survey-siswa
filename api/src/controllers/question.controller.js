const questionModel = require('../models/question.model');
const surveyModel = require('../models/survey.model');
const { QUESTION_TYPES } = require('../constants/surveys');

function validateOpsi(tipeJawaban, opsi) {
  if (tipeJawaban === 'pilihan_ganda') {
    if (!Array.isArray(opsi) || opsi.length < 2) {
      return 'opsi wajib berupa array minimal 2 pilihan untuk tipe_jawaban pilihan_ganda';
    }
  }
  return null;
}

async function list(req, res, next) {
  try {
    const survey = await surveyModel.findById(req.params.surveyId);
    if (!survey) {
      return res.status(404).json({ error: { message: 'Survey tidak ditemukan' } });
    }
    const questions = await questionModel.listBySurvey(survey.id);
    res.json({ questions });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const survey = await surveyModel.findById(req.params.surveyId);
    if (!survey) {
      return res.status(404).json({ error: { message: 'Survey tidak ditemukan' } });
    }
    if (survey.status !== 'draft') {
      return res.status(409).json({ error: { message: 'Pertanyaan hanya bisa ditambahkan saat survey berstatus draft' } });
    }

    const { teks_pertanyaan, tipe_jawaban, opsi, wajib, urutan } = req.body;
    if (!teks_pertanyaan || !tipe_jawaban) {
      return res.status(400).json({ error: { message: 'teks_pertanyaan dan tipe_jawaban wajib diisi' } });
    }
    if (!QUESTION_TYPES.includes(tipe_jawaban)) {
      return res.status(400).json({ error: { message: `tipe_jawaban harus salah satu dari: ${QUESTION_TYPES.join(', ')}` } });
    }
    const opsiError = validateOpsi(tipe_jawaban, opsi);
    if (opsiError) {
      return res.status(400).json({ error: { message: opsiError } });
    }

    const finalUrutan = urutan ?? (await questionModel.countBySurvey(survey.id)) + 1;

    const question = await questionModel.create({
      survey_id: survey.id,
      urutan: finalUrutan,
      teks_pertanyaan,
      tipe_jawaban,
      opsi: opsi ? JSON.stringify(opsi) : null,
      wajib: wajib ?? true,
    });
    res.status(201).json({ question });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const question = await questionModel.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ error: { message: 'Pertanyaan tidak ditemukan' } });
    }
    const survey = await surveyModel.findById(question.survey_id);
    if (survey.status !== 'draft') {
      return res.status(409).json({ error: { message: 'Pertanyaan hanya bisa diubah saat survey berstatus draft' } });
    }

    const { teks_pertanyaan, tipe_jawaban, opsi, wajib, urutan } = req.body;
    const effectiveTipe = tipe_jawaban || question.tipe_jawaban;

    if (tipe_jawaban && !QUESTION_TYPES.includes(tipe_jawaban)) {
      return res.status(400).json({ error: { message: `tipe_jawaban harus salah satu dari: ${QUESTION_TYPES.join(', ')}` } });
    }
    if (opsi !== undefined) {
      const opsiError = validateOpsi(effectiveTipe, opsi);
      if (opsiError) {
        return res.status(400).json({ error: { message: opsiError } });
      }
    }

    const fields = { teks_pertanyaan, tipe_jawaban, wajib, urutan };
    if (opsi !== undefined) fields.opsi = opsi === null ? null : JSON.stringify(opsi);
    Object.keys(fields).forEach((key) => fields[key] === undefined && delete fields[key]);

    const updated = await questionModel.update(req.params.id, fields);
    res.json({ question: updated });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const question = await questionModel.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ error: { message: 'Pertanyaan tidak ditemukan' } });
    }
    const survey = await surveyModel.findById(question.survey_id);
    if (survey.status !== 'draft') {
      return res.status(409).json({ error: { message: 'Pertanyaan hanya bisa dihapus saat survey berstatus draft' } });
    }
    await questionModel.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove };
