const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const role = require('../middlewares/role');
const { register, login, forgotPassword, verifyOTP, resetPassword, me, logout, pending, approve, reject,getDoctors } = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.get('/me', auth, me);
router.post('/logout', auth, logout);
router.get('/doctors', auth, getDoctors);

module.exports = router;
