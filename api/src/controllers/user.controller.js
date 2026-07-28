const { parse } = require('csv-parse/sync');
const userModel = require('../models/user.model');
const authService = require('../services/auth.service');
const ROLES = require('../constants/roles');

const PG_UNIQUE_VIOLATION = '23505';
const PG_FOREIGN_KEY_VIOLATION = '23503';

function validateRole(role) {
  return ROLES.includes(role);
}

async function list(req, res, next) {
  try {
    const { role, kelas, angkatan } = req.query;
    const users = await userModel.list({ role, kelas, angkatan });
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { nama, email, password, role, kelas, angkatan, mapel_diampu } = req.body;

    if (!nama || !email || !password || !role) {
      return res.status(400).json({
        error: { message: 'nama, email, password, dan role wajib diisi' },
      });
    }
    if (!validateRole(role)) {
      return res.status(400).json({ error: { message: `role harus salah satu dari: ${ROLES.join(', ')}` } });
    }

    const user = await userModel.create({
      nama,
      email,
      password_hash: await authService.hashPassword(password),
      role,
      kelas,
      angkatan,
      mapel_diampu,
    });
    res.status(201).json({ user });
  } catch (err) {
    if (err.code === PG_UNIQUE_VIOLATION) {
      return res.status(409).json({ error: { message: 'Email sudah terdaftar' } });
    }
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const { id } = req.params;
    if (req.user.role !== 'admin' && req.user.sub !== id) {
      return res.status(403).json({ error: { message: 'Tidak punya akses' } });
    }

    const user = userModel.sanitize(await userModel.findById(id));
    if (!user) {
      return res.status(404).json({ error: { message: 'User tidak ditemukan' } });
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { nama, email, password, role, kelas, angkatan, mapel_diampu } = req.body;

    if (role && !validateRole(role)) {
      return res.status(400).json({ error: { message: `role harus salah satu dari: ${ROLES.join(', ')}` } });
    }

    const fields = { nama, email, role, kelas, angkatan, mapel_diampu };
    if (password) {
      fields.password_hash = await authService.hashPassword(password);
    }
    Object.keys(fields).forEach((key) => fields[key] === undefined && delete fields[key]);

    const user = await userModel.update(id, fields);
    if (!user) {
      return res.status(404).json({ error: { message: 'User tidak ditemukan' } });
    }
    res.json({ user });
  } catch (err) {
    if (err.code === PG_UNIQUE_VIOLATION) {
      return res.status(409).json({ error: { message: 'Email sudah terdaftar' } });
    }
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const deletedCount = await userModel.remove(id);
    if (!deletedCount) {
      return res.status(404).json({ error: { message: 'User tidak ditemukan' } });
    }
    res.status(204).send();
  } catch (err) {
    if (err.code === PG_FOREIGN_KEY_VIOLATION) {
      return res.status(409).json({
        error: { message: 'User tidak bisa dihapus karena masih terkait data lain (survey/response)' },
      });
    }
    next(err);
  }
}

async function importCsv(req, res, next) {
  try {
    const { csv } = req.body;
    if (!csv) {
      return res.status(400).json({ error: { message: 'Field csv wajib diisi (nama,email,password,role,kelas,angkatan,mapel_diampu)' } });
    }

    const rows = parse(csv, { columns: true, skip_empty_lines: true, trim: true });

    const created = [];
    const failed = [];

    for (const [index, row] of rows.entries()) {
      try {
        if (!row.nama || !row.email || !row.password || !row.role) {
          throw new Error('nama, email, password, dan role wajib diisi');
        }
        if (!validateRole(row.role)) {
          throw new Error(`role harus salah satu dari: ${ROLES.join(', ')}`);
        }

        const user = await userModel.create({
          nama: row.nama,
          email: row.email,
          password_hash: await authService.hashPassword(row.password),
          role: row.role,
          kelas: row.kelas || null,
          angkatan: row.angkatan ? Number(row.angkatan) : null,
          mapel_diampu: row.mapel_diampu || null,
        });
        created.push(user);
      } catch (rowErr) {
        const message = rowErr.code === PG_UNIQUE_VIOLATION ? 'Email sudah terdaftar' : rowErr.message;
        failed.push({ row: index + 1, email: row.email, message });
      }
    }

    res.status(201).json({ created, failed });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, getById, update, remove, importCsv };
