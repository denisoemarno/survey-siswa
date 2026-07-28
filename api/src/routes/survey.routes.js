const { Router } = require('express');
const surveyController = require('../controllers/survey.controller');
const questionController = require('../controllers/question.controller');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

router.use(authenticate);

router.get('/', authorize('admin', 'siswa'), surveyController.list);
router.post('/', authorize('admin'), surveyController.create);
router.get('/:id', authorize('admin', 'siswa'), surveyController.getById);
router.put('/:id', authorize('admin'), surveyController.update);
router.delete('/:id', authorize('admin'), surveyController.remove);
router.post('/:id/publish', authorize('admin'), surveyController.publish);
router.post('/:id/close', authorize('admin'), surveyController.close);

router.get('/:surveyId/questions', authorize('admin'), questionController.list);
router.post('/:surveyId/questions', authorize('admin'), questionController.create);

module.exports = router;
