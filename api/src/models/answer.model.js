const db = require('../config/db');

const TABLE = 'answers';

function bulkCreate(trx, rows) {
  if (!rows.length) return Promise.resolve([]);
  return (trx || db)(TABLE).insert(rows).returning('*');
}

function listByResponse(responseId) {
  return db(TABLE).where({ response_id: responseId });
}

function listBySurvey(surveyId) {
  return db(TABLE)
    .join('questions', 'questions.id', 'answers.question_id')
    .where('questions.survey_id', surveyId)
    .select('answers.*');
}

module.exports = { bulkCreate, listByResponse, listBySurvey };
