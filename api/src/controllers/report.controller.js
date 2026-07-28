const surveyModel = require('../models/survey.model');
const questionModel = require('../models/question.model');
const responseModel = require('../models/response.model');
const answerModel = require('../models/answer.model');
const userModel = require('../models/user.model');

const MIN_RESPONDENTS_FOR_ANONYMITY = 5;

function aggregateQuestion(question, answersForQuestion) {
  const base = {
    id: question.id,
    teks_pertanyaan: question.teks_pertanyaan,
    tipe_jawaban: question.tipe_jawaban,
    wajib: question.wajib,
    jumlah_dijawab: answersForQuestion.length,
  };

  if (question.tipe_jawaban === 'pilihan_ganda') {
    const opsiList = question.opsi || [];
    const counts = Object.fromEntries(opsiList.map((o) => [o, 0]));
    answersForQuestion.forEach((a) => {
      if (counts[a.jawaban_pilihan] !== undefined) counts[a.jawaban_pilihan] += 1;
    });
    const total = answersForQuestion.length;
    base.distribusi = opsiList.map((o) => ({
      opsi: o,
      count: counts[o],
      persentase: total ? Math.round((counts[o] / total) * 1000) / 10 : 0,
    }));
    return base;
  }

  if (question.tipe_jawaban === 'skala') {
    const values = answersForQuestion.map((a) => a.jawaban_skala).filter((v) => v !== null && v !== undefined);
    const total = values.length;
    const sum = values.reduce((acc, v) => acc + v, 0);
    base.rata_rata = total ? Math.round((sum / total) * 100) / 100 : null;
    base.distribusi = [1, 2, 3, 4, 5].map((skala) => ({
      skala,
      count: values.filter((v) => v === skala).length,
    }));
    return base;
  }

  base.jawaban = answersForQuestion.map((a) => a.jawaban_teks).filter(Boolean);
  return base;
}

async function getReport(req, res, next) {
  try {
    const survey = await surveyModel.findById(req.params.surveyId);
    if (!survey) {
      return res.status(404).json({ error: { message: 'Survey tidak ditemukan' } });
    }

    if (req.user.role === 'guru' && (survey.tipe !== 'evaluasi_guru' || survey.guru_id !== req.user.sub)) {
      return res.status(403).json({ error: { message: 'Tidak punya akses ke laporan survey ini' } });
    }

    const totalResponses = await responseModel.countBySurvey(survey.id);

    if (req.user.role === 'guru' && totalResponses < MIN_RESPONDENTS_FOR_ANONYMITY) {
      return res.json({ message: 'Data belum cukup untuk ditampilkan' });
    }

    const [questions, allAnswers, totalTarget] = await Promise.all([
      questionModel.listBySurvey(survey.id),
      answerModel.listBySurvey(survey.id),
      userModel.countByTarget({ kelas: survey.target_kelas, angkatan: survey.target_angkatan }),
    ]);

    const answersByQuestion = new Map();
    allAnswers.forEach((a) => {
      if (!answersByQuestion.has(a.question_id)) answersByQuestion.set(a.question_id, []);
      answersByQuestion.get(a.question_id).push(a);
    });

    res.json({
      survey: {
        id: survey.id,
        judul: survey.judul,
        tipe: survey.tipe,
        status: survey.status,
        target_kelas: survey.target_kelas,
        target_angkatan: survey.target_angkatan,
      },
      participation: {
        total_responses: totalResponses,
        total_target: totalTarget,
        rate: totalTarget ? Math.round((totalResponses / totalTarget) * 1000) / 10 : null,
      },
      questions: questions.map((q) => aggregateQuestion(q, answersByQuestion.get(q.id) || [])),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getReport };
