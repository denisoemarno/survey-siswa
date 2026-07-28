const db = require('../config/db');

const TABLE = 'answers';

function bulkCreate(trx, rows) {
  if (!rows.length) return Promise.resolve([]);
  return (trx || db)(TABLE).insert(rows).returning('*');
}

function listByResponse(responseId) {
  return db(TABLE).where({ response_id: responseId });
}

module.exports = { bulkCreate, listByResponse };
