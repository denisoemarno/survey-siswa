const db = require('../config/db');

const TABLE = 'users';

function findByEmail(email) {
  return db(TABLE).where({ email }).first();
}

function findById(id) {
  return db(TABLE).where({ id }).first();
}

function create({ nama, email, password_hash, role, kelas, angkatan, mapel_diampu }) {
  return db(TABLE)
    .insert({ nama, email, password_hash, role, kelas, angkatan, mapel_diampu })
    .returning('*')
    .then((rows) => rows[0]);
}

module.exports = { findByEmail, findById, create };
