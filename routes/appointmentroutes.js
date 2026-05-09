const express = require('express');
const router = express.Router();
const controller = require('../controllers/appointmentcontroller');
const { verifytoken } = require('../middlwere/authmiddleware');
const { allowrole } = require('../middlwere/rolemiddleware');

// 🔧 FIX: Appointment endpoints are protected by auth + role middleware.
router.post('/appointment' , verifytoken, allowrole('admin', 'doctor', 'nurse', 'staff'), controller.create);
router.get('/appointment/receiver/:receiver_id', verifytoken, allowrole('admin', 'doctor', 'nurse', 'staff'), controller.getbyreceiver);
router.get('/appointment/sender/:sender_id', verifytoken, allowrole('admin', 'doctor', 'nurse', 'staff'), controller.getbysender);
router.put('/appointment/status/:id', verifytoken, allowrole('admin', 'doctor', 'nurse', 'staff'), controller.updatestatus);
router.put('/appointment/datetime/:id', verifytoken, allowrole('admin', 'doctor', 'nurse', 'staff'), controller.updatedatetime);
router.delete('/appointment/:id', verifytoken, allowrole('admin', 'doctor', 'nurse', 'staff'), controller.delete);

module.exports = router;