const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// All routes require authentication AND Patient role
router.use(authMiddleware);
router.use(roleMiddleware('Patient'));

router.get('/my-profile',           patientController.getMyProfile);
router.put('/update-profile',       patientController.updateMyProfile);
router.get('/my-appointments',      patientController.getMyAppointments);
router.get('/my-doctors',           patientController.getMyDoctors);
router.post('/book-appointment',    patientController.bookAppointment);
router.delete('/delete-my-account', patientController.deleteSelf);

module.exports = router;
