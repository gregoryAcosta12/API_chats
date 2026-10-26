const express = require('express');
const router = express.Router();
const callController = require('../controllers/callController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.post('/', callController.start);
router.patch('/:id', callController.update);
router.get('/history', callController.history);

module.exports = router;