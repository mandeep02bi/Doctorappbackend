const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const {
    createInvoice,
    getAllInvoices,
    getInvoiceById,
    updateInvoiceStatus,
} = require('../controllers/invoice.controller');

router.post('/', auth, role('Admin', 'Staff'), createInvoice);
router.get('/', auth, role('Admin', 'Staff'), getAllInvoices);
router.get('/:id', auth, role('Admin', 'Staff'), getInvoiceById);
router.patch('/:id/status', auth, role('Admin', 'Staff'), updateInvoiceStatus);

module.exports = router;
