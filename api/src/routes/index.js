const { Router } = require('express');
const db = require('../config/db');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const surveyRoutes = require('./survey.routes');
const questionRoutes = require('./question.routes');
const responseRoutes = require('./response.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/surveys', surveyRoutes);
router.use('/surveys', responseRoutes);
router.use('/questions', questionRoutes);

router.get('/health', async (req, res, next) => {
  try {
    await db.raw('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
