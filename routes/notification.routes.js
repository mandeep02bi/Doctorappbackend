const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const {
    getNotifications,
    markAsRead,
    deleteNotification,
} = require('../controllers/notification.controller');

router.get('/', auth, getNotifications);
router.patch('/:id/read', auth, markAsRead);
router.delete('/:id', auth, deleteNotification);

module.exports = router;
