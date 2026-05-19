const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const { createPatient, getAllPatients, getPatient, updatePatient, deletePatient, searchPatients } = require('../controllers/patient.controller');

router.post('/', auth, role('Admin', 'Doctor', 'Staff'), createPatient);
router.get('/', auth, role('Admin', 'Doctor', 'Staff'), getAllPatients);
router.get('/search', auth, role('Admin', 'Doctor', 'Staff'), searchPatients);
router.get('/:patient_code', auth, role('Admin', 'Doctor', 'Staff'), getPatient);
router.put('/:patient_code', auth, role('Admin', 'Staff'), updatePatient);
router.delete('/:patient_code', auth, role('Admin', 'Staff'), deletePatient);

module.exports = router;
