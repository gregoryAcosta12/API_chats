const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/contacts', chatController.listContacts);
router.get('/unread', chatController.getUnread);
router.get('/conversation/:userId', chatController.getConversation);
router.post('/messages', chatController.sendMessage);

module.exports = router;