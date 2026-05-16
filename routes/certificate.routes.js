const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const ownership = require('../middlewares/ownership');
const {
    createCertificate,
    getAllCertificates,
    getCertificateById,
    updateCertificate,
    deleteCertificate,
} = require('../controllers/certificate.controller');

router.post('/', auth, role('Admin', 'Doctor'), createCertificate);
router.get('/', auth, role('Admin', 'Doctor', 'Staff'), getAllCertificates);            // ← Staff added
router.get('/:id', auth, role('Admin', 'Doctor', 'Staff'), getCertificateById);        // ← Staff added
router.put('/:id', auth, role('Admin', 'Doctor'), ownership('certificates', 'doctor_id'), updateCertificate);
router.delete('/:id', auth, role('Admin', 'Doctor'), ownership('certificates', 'doctor_id'), deleteCertificate);

module.exports = router;