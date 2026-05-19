const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const ownership = require('../middlewares/ownership');
const { createConsent, getAllConsents, getConsent, updateConsent, deleteConsent } = require('../controllers/consent.controller');

router.post('/', auth, role('Admin', 'Doctor'), createConsent);
router.get('/', auth, role('Admin', 'Doctor', 'Staff'), getAllConsents);
router.get('/:id', auth, role('Admin', 'Doctor', 'Staff'), getConsent);
router.put('/:id', auth, role('Admin', 'Doctor'), ownership('consents', 'doctor_id'), updateConsent);
router.delete('/:id', auth, role('Admin', 'Doctor'), ownership('consents', 'doctor_id'), deleteConsent);

module.exports = router;
