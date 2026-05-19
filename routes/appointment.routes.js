const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const { createAppointment, getAllAppointments, todayAppointments, calendarAppointments, getAppointment, updateAppointment, updateStatus, deleteAppointment } = require('../controllers/appointment.controller');

router.post('/', auth, role('Admin', 'Doctor', 'Staff'), createAppointment);
router.get('/', auth, role('Admin', 'Doctor', 'Staff'), getAllAppointments);
router.get('/today', auth, role('Admin', 'Doctor', 'Staff'), todayAppointments);
router.get('/calendar', auth, role('Admin', 'Doctor', 'Staff'), calendarAppointments);
router.get('/:id', auth, role('Admin', 'Doctor', 'Staff'), getAppointment);
router.put('/:id', auth, role('Admin', 'Doctor', 'Staff'), updateAppointment);
router.patch('/:id/status', auth, role('Admin', 'Doctor', 'Staff'), updateStatus);
router.delete('/:id', auth, role('Admin', 'Doctor', 'Staff'), deleteAppointment);

module.exports = router;
