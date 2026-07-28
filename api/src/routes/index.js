const { Router } = require('express');
const db = require('../config/db');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);

router.get('/health', async (req, res, next) => {
  try {
    await db.raw('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
