const db = require('../config/db');

const TABLE = 'users';
const SAFE_COLUMNS = [
  'id',
  'nama',
  'email',
  'role',
  'kelas',
  'angkatan',
  'mapel_diampu',
  'created_at',
  'updated_at',
];

function sanitize(user) {
  if (!user) return user;
  const { password_hash: _password_hash, ...rest } = user;
  return rest;
}

function findByEmail(email) {
  return db(TABLE).where({ email }).first();
}

function findById(id) {
  return db(TABLE).where({ id }).first();
}

function list({ role, kelas, angkatan } = {}) {
  return db(TABLE)
    .select(SAFE_COLUMNS)
    .modify((qb) => {
      if (role) qb.where('role', role);
      if (kelas) qb.where('kelas', kelas);
      if (angkatan) qb.where('angkatan', angkatan);
    })
    .orderBy('nama');
}

function create({ nama, email, password_hash, role, kelas, angkatan, mapel_diampu }) {
  return db(TABLE)
    .insert({ nama, email, password_hash, role, kelas, angkatan, mapel_diampu })
    .returning(SAFE_COLUMNS)
    .then((rows) => rows[0]);
}

function update(id, fields) {
  return db(TABLE)
    .where({ id })
    .update({ ...fields, updated_at: db.fn.now() })
    .returning(SAFE_COLUMNS)
    .then((rows) => rows[0]);
}

function remove(id) {
  return db(TABLE).where({ id }).del();
}

function countByTarget({ kelas, angkatan } = {}) {
  return db(TABLE)
    .where('role', 'siswa')
    .modify((qb) => {
      if (kelas) qb.where('kelas', kelas);
      if (angkatan) qb.where('angkatan', angkatan);
    })
    .count('id as count')
    .first()
    .then((row) => Number(row.count));
}

module.exports = { sanitize, findByEmail, findById, list, create, update, remove, countByTarget };
