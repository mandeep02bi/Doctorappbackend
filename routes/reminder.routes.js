const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const {
    createReminder,
    getAllReminders,
    updateReminder,
    deleteReminder,
} = require('../controllers/reminder.controller');

router.post('/', auth, role('Admin', 'Staff'), createReminder);
router.get('/', auth, role('Admin', 'Staff'), getAllReminders);
router.put('/:id', auth, role('Admin', 'Staff'), updateReminder);
router.delete('/:id', auth, role('Admin', 'Staff'), deleteReminder);

module.exports = router;
