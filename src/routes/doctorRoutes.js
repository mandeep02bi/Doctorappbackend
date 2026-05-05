const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// All routes require authentication AND Doctor role
router.use(authMiddleware);
router.use(roleMiddleware('Doctor'));

router.get('/my-profile',                               doctorController.getMyProfile);
router.put('/my-profile',                               doctorController.updateMyProfile);
router.get('/my-patients',                              doctorController.getMyPatients);
router.get('/my-appointments',                          doctorController.getMyAppointments);
router.get('/patient/:patientId',                       doctorController.getPatientDetail);
router.put('/patient/:patientId',                       doctorController.updatePatientProfile);   // Doctor updates patient medical record
router.post('/prescribe/:patientId',                    doctorController.createPrescription);
router.put('/appointment/:appointmentId/status',        doctorController.updateAppointmentStatus);
router.delete('/delete-my-account',                     doctorController.deleteSelf);

module.exports = router;
