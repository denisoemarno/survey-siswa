const db = require('../config/db');

const TABLE = 'questions';

function listBySurvey(surveyId) {
  return db(TABLE).where({ survey_id: surveyId }).orderBy('urutan');
}

function findById(id) {
  return db(TABLE).where({ id }).first();
}

function countBySurvey(surveyId) {
  return db(TABLE)
    .where({ survey_id: surveyId })
    .count('id as count')
    .first()
    .then((row) => Number(row.count));
}

function create(data) {
  return db(TABLE)
    .insert(data)
    .returning('*')
    .then((rows) => rows[0]);
}

function update(id, fields) {
  return db(TABLE)
    .where({ id })
    .update(fields)
    .returning('*')
    .then((rows) => rows[0]);
}

function remove(id) {
  return db(TABLE).where({ id }).del();
}

module.exports = { listBySurvey, findById, countBySurvey, create, update, remove };
