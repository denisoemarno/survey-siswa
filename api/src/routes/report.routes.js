const { Router } = require('express');
const reportController = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

router.use(authenticate);

router.get('/:surveyId/report', authorize('admin', 'guru'), reportController.getReport);

module.exports = router;
