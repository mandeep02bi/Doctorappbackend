const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const { createReminder, getAllReminders, updateReminder, deleteReminder } = require('../controllers/reminder.controller');

router.post('/', auth, role('Admin', 'Doctor', 'Staff'), createReminder);
router.get('/', auth, role('Admin', 'Doctor', 'Staff'), getAllReminders);
router.put('/:id', auth, role('Admin', 'Doctor', 'Staff'), updateReminder);
router.delete('/:id', auth, role('Admin', 'Doctor', 'Staff'), deleteReminder);

module.exports = router;
