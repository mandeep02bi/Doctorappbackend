const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const { createInvoice, getAllInvoices, getInvoice, updateInvoice, updateInvoiceStatus, deleteInvoice, addItem, deleteItem } = require('../controllers/invoice.controller');

router.post('/', auth, role('Admin', 'Staff'), createInvoice);
router.get('/', auth, role('Admin', 'Staff'), getAllInvoices);
router.get('/:id', auth, role('Admin', 'Staff'), getInvoice);
router.put('/:id', auth, role('Admin', 'Staff'), updateInvoice);
router.patch('/:id/status', auth, role('Admin', 'Staff'), updateInvoiceStatus);
router.delete('/:id', auth, role('Admin', 'Staff'), deleteInvoice);
router.post('/:id/items', auth, role('Admin', 'Staff'), addItem);
router.delete('/:id/items/:itemId', auth, role('Admin', 'Staff'), deleteItem);

module.exports = router;
