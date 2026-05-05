const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// All routes require token + Admin role
router.use(authMiddleware);
router.use(roleMiddleware('Admin'));

router.get('/unverified-users',     adminController.getUnverifiedUsers);  // List pending accounts with OTP
router.post('/resend-otp',          adminController.resendOTP);            // Admin resends new OTP to Doctor/Nurse
router.get('/all-users',            adminController.getAllUsers);           // See all (filterable by ?role=)
router.delete('/delete-user/:id',   adminController.softDeleteUser);       // Soft delete any account

module.exports = router;
