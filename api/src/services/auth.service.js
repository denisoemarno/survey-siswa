const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');

const SALT_ROUNDS = 10;

function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function generateToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

async function login(email, password) {
  const user = await userModel.findByEmail(email);
  if (!user) {
    const err = new Error('Email atau password salah');
    err.status = 401;
    throw err;
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    const err = new Error('Email atau password salah');
    err.status = 401;
    throw err;
  }

  const token = generateToken(user);
  const { password_hash, ...safeUser } = user;
  return { token, user: safeUser };
}

module.exports = { hashPassword, verifyPassword, generateToken, login };
