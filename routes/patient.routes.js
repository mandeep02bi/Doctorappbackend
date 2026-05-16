const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const {
    createPatient,
    getAllPatients,
    getPatientById,
    updatePatient,
    deletePatient,
    searchPatients,
    getPatientTimeline,
} = require('../controllers/patient.controller');

// Search must be before :id routes
router.get('/search', auth, role('Admin', 'Doctor', 'Staff'), searchPatients);
router.get('/:id/timeline', auth, role('Admin', 'Doctor', 'Staff'), getPatientTimeline);

router.post('/', auth, role('Admin', 'Doctor', 'Staff'), createPatient);
router.get('/', auth, role('Admin', 'Doctor', 'Staff'), getAllPatients);
router.get('/:id', auth, role('Admin', 'Doctor', 'Staff'), getPatientById);
router.put('/:id', auth, role('Admin', 'Staff'), updatePatient);
router.delete('/:id', auth, role('Admin', 'Staff'), deletePatient);

module.exports = router;
