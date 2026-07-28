const { Router } = require('express');
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

router.use(authenticate);

router.get('/', authorize('admin'), userController.list);
router.post('/', authorize('admin'), userController.create);
router.post('/import', authorize('admin'), userController.importCsv);
router.get('/:id', userController.getById);
router.put('/:id', authorize('admin'), userController.update);
router.delete('/:id', authorize('admin'), userController.remove);

module.exports = router;
