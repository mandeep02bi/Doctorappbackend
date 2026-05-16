const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const {
    register,
    login,
    forgotPassword,
    verifyOTP,
    resetPassword,
    getMe,
    logout,
} = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.get('/me', auth, getMe);
router.post('/logout', auth, logout);

module.exports = router;
