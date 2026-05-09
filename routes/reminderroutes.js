const express = require('express');
const router = express.Router();
const controller = require('../controllers/remindercontroller');
const { verifytoken } = require('../middlwere/authmiddleware');
const { allowrole } = require('../middlwere/rolemiddleware');

// 🔧 FIX: Protected APIs must require valid JWT token.
router.post('/reminder' , verifytoken, allowrole('admin', 'doctor', 'nurse', 'staff'), controller.create);
router.get('/reminder/receiver/:receiver_id', verifytoken, allowrole('admin', 'doctor', 'nurse', 'staff'), controller.getbyreceiver);
router.get('/reminder/sender/:sender_id', verifytoken, allowrole('admin', 'doctor', 'nurse', 'staff'), controller.getbysender);

module.exports = router;