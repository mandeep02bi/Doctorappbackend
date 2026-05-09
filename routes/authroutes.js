const express = require('express');
const router = express.Router();
const authcontroller = require('../controllers/authcontroller');
const { verifytoken } = require('../middlwere/authmiddleware');

router.post('/signup' , authcontroller.register);
router.post('/login' , authcontroller.login);
router.post('/refresh-token' , authcontroller.refreshtoken);
router.post('/logout' , authcontroller.logout);

router.post('/forgot-password' , authcontroller.forgotpassword);
router.post('/verify-otp' , authcontroller.verifyotp);
router.post('/reset-password' , authcontroller.resetpassword);
router.get('/profile', verifytoken, authcontroller.profile);

module.exports = router;