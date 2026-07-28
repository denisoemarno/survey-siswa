const authService = require('../services/auth.service');
const userModel = require('../models/user.model');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: { message: 'email dan password wajib diisi' } });
    }

    const { token, user } = await authService.login(email, password);
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await userModel.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({ error: { message: 'User tidak ditemukan' } });
    }
    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, me };
