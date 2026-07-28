const { Router } = require('express');
const db = require('../config/db');

const router = Router();

router.get('/health', async (req, res, next) => {
  try {
    await db.raw('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
