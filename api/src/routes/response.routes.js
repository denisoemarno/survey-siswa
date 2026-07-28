const { Router } = require('express');
const responseController = require('../controllers/response.controller');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

router.use(authenticate);

router.get('/:surveyId/responses/me', authorize('siswa'), responseController.status);
router.post('/:surveyId/responses', authorize('siswa'), responseController.submit);

module.exports = router;
