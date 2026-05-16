const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const {
    globalSearch,
    searchPatients,
    searchPrescriptions,
    searchInvoices,
    searchRecords,
} = require('../controllers/search.controller');

router.get('/global', auth, globalSearch);
router.get('/patients', auth, searchPatients);
router.get('/prescriptions', auth, searchPrescriptions);
router.get('/invoices', auth, searchInvoices);
router.get('/records', auth, searchRecords);

module.exports = router;
