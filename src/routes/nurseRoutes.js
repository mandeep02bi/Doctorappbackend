const express = require('express');
const router = express.Router();
const nurseController = require('../controllers/nurseController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// All routes require authentication AND the Nurse role
router.use(authMiddleware);
router.use(roleMiddleware('Nurse'));

router.get('/my-profile',     nurseController.getMyProfile);
router.put('/my-profile',     nurseController.updateMyProfile);
router.post('/create-patient',      nurseController.createPatient);
router.post('/book-appointment',    nurseController.bookAppointmentForPatient);
router.delete('/delete-my-account', nurseController.deleteSelf);

module.exports = router;
