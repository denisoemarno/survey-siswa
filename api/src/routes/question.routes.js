const { Router } = require('express');
const questionController = require('../controllers/question.controller');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

router.use(authenticate, authorize('admin'));

router.put('/:id', questionController.update);
router.delete('/:id', questionController.remove);

module.exports = router;
