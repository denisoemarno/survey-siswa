const db = require('../config/db');

const TABLE = 'responses';

function findBySurveyAndSiswa(surveyId, siswaId) {
  return db(TABLE).where({ survey_id: surveyId, siswa_id: siswaId }).first();
}

function create(trx, { survey_id, siswa_id }) {
  return (trx || db)(TABLE)
    .insert({ survey_id, siswa_id })
    .returning('*')
    .then((rows) => rows[0]);
}

function countBySurvey(surveyId) {
  return db(TABLE)
    .where({ survey_id: surveyId })
    .count('id as count')
    .first()
    .then((row) => Number(row.count));
}

module.exports = { findBySurveyAndSiswa, create, countBySurvey };
