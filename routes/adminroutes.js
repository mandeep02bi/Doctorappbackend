const express = require('express');
const router = express.Router();
const admincontroller = require('../controllers/admincontroller');
const { verifytoken } = require('../middlwere/authmiddleware');
const { allowrole } = require('../middlwere/rolemiddleware');

router.get('/admin/users', verifytoken, allowrole('admin'), admincontroller.getpendinguser);
router.get('/admin/allusers', verifytoken, allowrole('admin'), admincontroller.getallusers);
router.patch('/admin/approve/:id', verifytoken, allowrole('admin'), admincontroller.approveuser);
router.patch('/admin/reject/:id', verifytoken, allowrole('admin'), admincontroller.rejectuser);

module.exports = router;