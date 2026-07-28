const db = require('../config/db');

const TABLE = 'surveys';

function list({ tipe, status } = {}) {
  return db(TABLE)
    .modify((qb) => {
      if (tipe) qb.where('tipe', tipe);
      if (status) qb.where('status', status);
    })
    .orderBy('created_at', 'desc');
}

function findById(id) {
  return db(TABLE).where({ id }).first();
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
    .update({ ...fields, updated_at: db.fn.now() })
    .returning('*')
    .then((rows) => rows[0]);
}

function remove(id) {
  return db(TABLE).where({ id }).del();
}

module.exports = { list, findById, create, update, remove };
