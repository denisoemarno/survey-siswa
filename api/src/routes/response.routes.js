const { Router } = require('express');
const responseController = require('../controllers/response.controller');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

router.use(authenticate, authorize('siswa'));

router.get('/:surveyId/responses/me', responseController.status);
router.post('/:surveyId/responses', responseController.submit);

module.exports = router;
