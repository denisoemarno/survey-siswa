const { Router } = require('express');
const surveyController = require('../controllers/survey.controller');
const questionController = require('../controllers/question.controller');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/', surveyController.list);
router.post('/', surveyController.create);
router.get('/:id', surveyController.getById);
router.put('/:id', surveyController.update);
router.delete('/:id', surveyController.remove);
router.post('/:id/publish', surveyController.publish);
router.post('/:id/close', surveyController.close);

router.get('/:surveyId/questions', questionController.list);
router.post('/:surveyId/questions', questionController.create);

module.exports = router;
