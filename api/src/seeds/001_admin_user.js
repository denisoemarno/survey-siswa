const authService = require('../services/auth.service');

/**
 * Bootstrap satu akun admin untuk dev/testing.
 * Belum ada endpoint self-register (user dibuat oleh Admin lewat
 * CRUD User), jadi seed ini yang menyediakan admin pertama.
 * @param { import("knex").Knex } knex
 */
exports.seed = async function (knex) {
  const email = process.env.ADMIN_EMAIL || 'admin@survey-siswa.test';
  const password = process.env.ADMIN_PASSWORD || 'admin12345';

  await knex('users')
    .insert({
      nama: 'Admin',
      email,
      password_hash: await authService.hashPassword(password),
      role: 'admin',
    })
    .onConflict('email')
    .merge(['password_hash']);
};
