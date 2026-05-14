const express = require('express');
const router = express.Router();

const patientcontroller = require('../controllers/patientcontroller');
const { verifytoken } = require('../middlwere/authmiddleware');
const { allowrole } = require('../middlwere/rolemiddleware');

router.post(
    '/patient', 
    verifytoken, 
    allowrole( 'doctor', 'nurse'), patientcontroller.createpatient);


router.get(
    '/patient', 
    verifytoken, 
    allowrole( 'doctor', 'nurse'), patientcontroller.getallpatient);

router.get(
    '/patient/:id', 
    verifytoken, 
    allowrole('doctor', 'nurse'), patientcontroller.getpatientbyid);
        
module.exports = router;