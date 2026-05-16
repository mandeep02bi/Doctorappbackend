const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const ownership = require('../middlewares/ownership');
const {
    createPrescription,
    getPrescriptionById,
    updatePrescription,
    deletePrescription,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    addLabTest,
    deleteLabTest,
} = require('../controllers/prescription.controller');

router.post('/', auth, role('Admin', 'Doctor'), createPrescription);
router.get('/:id', auth, role('Admin', 'Doctor', 'Staff'), getPrescriptionById);       // ← Staff added
router.put('/:id', auth, role('Admin', 'Doctor'), ownership('prescriptions', 'doctor_id'), updatePrescription);
router.delete('/:id', auth, role('Admin', 'Doctor'), ownership('prescriptions', 'doctor_id'), deletePrescription);

// Medicines
router.post('/:id/medicines', auth, role('Admin', 'Doctor'), ownership('prescriptions', 'doctor_id'), addMedicine);
router.put('/:id/medicines/:medicineId', auth, role('Admin', 'Doctor'), ownership('prescriptions', 'doctor_id'), updateMedicine);
router.delete('/:id/medicines/:medicineId', auth, role('Admin', 'Doctor'), ownership('prescriptions', 'doctor_id'), deleteMedicine);

// Lab Tests
router.post('/:id/lab-tests', auth, role('Admin', 'Doctor'), ownership('prescriptions', 'doctor_id'), addLabTest);
router.delete('/:id/lab-tests/:labTestId', auth, role('Admin', 'Doctor'), ownership('prescriptions', 'doctor_id'), deleteLabTest);

module.exports = router;