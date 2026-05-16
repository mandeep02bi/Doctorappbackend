const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const {
    createAppointment,
    getAllAppointments,
    getAppointmentById,
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
} = require('../controllers/appointment.controller');

router.post('/', auth, role('Admin', 'Staff'), createAppointment);
router.get('/', auth, role('Admin', 'Doctor', 'Staff'), getAllAppointments);
router.get('/:id', auth, role('Admin', 'Doctor', 'Staff'), getAppointmentById);
router.put('/:id', auth, role('Admin', 'Staff'), updateAppointment);
router.patch('/:id/status', auth, role('Admin', 'Staff'), updateAppointmentStatus);
router.delete('/:id', auth, role('Admin', 'Staff'), deleteAppointment);

module.exports = router;
