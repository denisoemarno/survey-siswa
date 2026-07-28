const db = require('../config/db');

const TABLE = 'surveys';

function list({ tipe, status, guru_id } = {}) {
  return db(TABLE)
    .modify((qb) => {
      if (tipe) qb.where('tipe', tipe);
      if (status) qb.where('status', status);
      if (guru_id) qb.where('guru_id', guru_id);
    })
    .orderBy('created_at', 'desc');
}

function findById(id) {
  return db(TABLE).where({ id }).first();
}

function listForSiswa({ kelas, angkatan, siswaId }) {
  return db(TABLE)
    .where('status', 'published')
    .andWhere((qb) => {
      qb.whereNull('target_kelas').orWhere('target_kelas', kelas);
    })
    .andWhere((qb) => {
      qb.whereNull('target_angkatan').orWhere('target_angkatan', angkatan);
    })
    .select(
      '*',
      db.raw(
        'EXISTS (SELECT 1 FROM responses WHERE responses.survey_id = surveys.id AND responses.siswa_id = ?) as submitted',
        [siswaId]
      )
    )
    .orderBy('periode_mulai', 'desc');
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

module.exports = { list, findById, listForSiswa, create, update, remove };
