const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// ── ADMIN SETUP (One-time only) ──────────────────────────
// Step 1: Create the Admin account (generates 10-digit OTP in DB)
router.post('/setup-admin',     authController.setupAdmin);

// Step 2: Admin reads OTP from DB and verifies their account
router.post('/verify-admin',    authController.verifyAdmin);

// ── DOCTOR & NURSE REGISTRATION ──────────────────────────
// Step 1: Doctor/Nurse registers (Admin gets OTP email)
router.post('/register',        authController.register);

// Step 2: Doctor/Nurse enters OTP (received from Admin) to activate
router.post('/verify-account',  authController.verifyAccount);

// ── ALL ROLES ─────────────────────────────────────────────
// Login (all verified roles)
router.post('/login',           authController.login);

// Forgot password OTP flow
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password',  authController.resetPassword);

// Change password while logged in
router.post('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
