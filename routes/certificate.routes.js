const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const ownership = require('../middlewares/ownership');
const pdfLimiter = require('../middlewares/pdfLimiter');
const { createCertificate, getAllCertificates, getCertificate, updateCertificate, deleteCertificate } = require('../controllers/certificate.controller');

router.post('/', auth, role('Admin', 'Doctor'), pdfLimiter, createCertificate);
router.get('/', auth, role('Admin', 'Doctor', 'Staff'), getAllCertificates);
router.get('/:id', auth, role('Admin', 'Doctor', 'Staff'), getCertificate);
router.put('/:id', auth, role('Admin', 'Doctor'), ownership('certificates', 'doctor_id'), updateCertificate);
router.delete('/:id', auth, role('Admin', 'Doctor'), ownership('certificates', 'doctor_id'), deleteCertificate);

module.exports = router;
